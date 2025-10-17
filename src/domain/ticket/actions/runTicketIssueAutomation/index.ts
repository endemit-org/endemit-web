import { inngest } from "@/services/inngest";
import {
  TicketCreationData,
  TicketPayload,
  TicketQueueEvent,
} from "@/domain/ticket/types/ticket";
import {
  createTicketTransaction,
  generateQrContent,
  generateSecureHash,
  generateShortId,
  generateTicketImage,
} from "@/domain/ticket/actions";
import { sendTicketEmail } from "@/domain/email/actions";
import { notifyOnNewTicketIssue } from "@/domain/notification/actions";
import { formatEventDateAndTime, formatPrice } from "@/lib/formatting";
import { fetchEventFromCmsById } from "@/domain/cms/actions";
import { splitArtistsIntoLines } from "@/domain/ticket/util";

export const runTicketIssueAutomation = inngest.createFunction(
  { id: "create-ticket-function", retries: 5 },
  { event: TicketQueueEvent.CREATE_TICKET },
  async ({ event, step }) => {
    const {
      eventId,
      eventName,
      ticketHolderName,
      ticketPayerEmail,
      price,
      orderId,
      metadata,
    } = event.data as TicketCreationData;

    const ticketBaseData = await step.run("generate-ticket-hash", async () => {
      const shortId = await generateShortId();
      const payLoad: TicketPayload = {
        eventId,
        eventName,
        ticketHolderName,
        ticketPayerEmail,
        orderId,
        price,
        shortId,
      };

      const hash = generateSecureHash(payLoad);
      const qrData = generateQrContent(hash, payLoad);

      if (!hash || !qrData) {
        throw new Error("Failed to generate ticket security data");
      }

      return { ticketHash: hash, qrContent: qrData, shortId };
    });

    const ticketTransaction = await step.run("create-ticket-db", async () => {
      const created = await createTicketTransaction({
        eventId,
        shortId: ticketBaseData.shortId,
        eventName,
        price,
        ticketHolderName,
        ticketPayerEmail,
        ticketHash: ticketBaseData.ticketHash,
        qrContent: ticketBaseData.qrContent,
        orderId,
        metadata,
      });

      if (!created) {
        throw new Error("Failed to create ticket in database");
      }

      return created;
    });

    const ticketImageWithEvent = await step.run(
      "create-ticket-image",
      async () => {
        const issuedTicket = ticketTransaction.ticket;
        const event = await fetchEventFromCmsById(eventId);

        if (
          !ticketBaseData ||
          !event?.coverImage?.src ||
          !event?.date_start ||
          !event?.venue ||
          !event?.artists ||
          event?.artists?.length === 0
        ) {
          throw new Error("Missing parameters for ticket image generation");
        }

        const image = await generateTicketImage({
          shortId: issuedTicket.shortId,
          hashId: ticketBaseData.ticketHash,
          qrData: JSON.stringify(ticketBaseData.qrContent),
          eventName: eventName,
          eventDetails: event.venue.name ?? "",
          eventDate: formatEventDateAndTime(event.date_start),
          attendeeName: ticketHolderName,
          attendeeEmail: ticketPayerEmail,
          artists: splitArtistsIntoLines(
            event.artists.map(artist => artist.name)
          ),
          price: formatPrice(Number(issuedTicket.price)),
          coverImageUrl: event.coverImage.src,
        });

        if (!image) {
          throw new Error("Failed to generate QR image");
        }

        return { image, event };
      }
    );

    await step.run("send-ticket-email", async () => {
      try {
        const issuedTicket = ticketTransaction.ticket;

        if (!ticketImageWithEvent.event.date_start) {
          throw new Error("Event date is missing for ticket email");
        }

        const result = await sendTicketEmail(
          {
            id: issuedTicket.id,
            eventName: issuedTicket.eventName,
            ticketHolderName: issuedTicket.ticketHolderName,
            ticketPayerEmail: issuedTicket.ticketPayerEmail,
            qrContent: issuedTicket.qrContent,
            ticketHash: issuedTicket.ticketHash,
            eventCoverImageUrl:
              ticketImageWithEvent.event.coverImage?.src || "",
            eventDate: new Date(ticketImageWithEvent.event.date_start),
            mapUrl: ticketImageWithEvent.event.venue?.mapLocationUrl || "",
            address: ticketImageWithEvent.event.venue?.address || "",
          },
          ticketImageWithEvent.image
        );

        if (!result || result.error) {
          throw new Error(
            `Failed to send ticket email: ${result?.error || "Unknown error"}`
          );
        }

        return result;
      } catch (error) {
        // Detect rate limit errors
        if (error instanceof Error) {
          if (
            error.message.includes("429") ||
            error.message.includes("rate limit")
          ) {
            throw new Error(
              `Rate limit hit when sending email for ticket ${ticketTransaction.ticket.id}`
            );
          }
        }

        throw new Error(
          `Email send failed for ticket ${ticketTransaction.ticket.id}: ${error}`
        );
      }
    });

    await step.run("send-instant-notification", async () => {
      const issuedTicket = ticketTransaction.ticket;
      const sequenceNumber = ticketTransaction.ticketCount;

      return await notifyOnNewTicketIssue({
        eventName: issuedTicket.eventName,
        ticketHolderName: issuedTicket.ticketHolderName,
        ticketPayerEmail: issuedTicket.ticketPayerEmail,
        ticketPrice: Number(issuedTicket.price),
        totalTicketsSoldForEvent: sequenceNumber,
      });
    });

    return { ticketId: ticketTransaction.ticket.id };
  }
);
