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

    const ticketSecurityData = await step.run(
      "generate-ticket-hash",
      async () => {
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
      }
    );

    const ticketTransaction = await step.run("create-ticket-db", async () => {
      const created = await createTicketTransaction({
        eventId,
        shortId: ticketSecurityData.shortId,
        eventName,
        price,
        ticketHolderName,
        ticketPayerEmail,
        ticketHash: ticketSecurityData.ticketHash,
        qrContent: ticketSecurityData.qrContent,
        orderId,
        metadata,
      });

      if (!created) {
        throw new Error("Failed to create ticket in database");
      }

      return created;
    });

    const ticketImage = await step.run("create-ticket-image", async () => {
      const issuedTicket = ticketTransaction.ticket;
      const event = await fetchEventFromCmsById(issuedTicket.eventId);

      if (
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
        hashId: ticketSecurityData.ticketHash,
        qrData: JSON.stringify(ticketSecurityData.qrContent),
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

      return image;
    });

    await step.run("send-ticket-email", async () => {
      const issuedTicket = ticketTransaction.ticket;

      try {
        const result = await sendTicketEmail(issuedTicket, ticketImage);

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
              `Rate limit hit when sending email for ticket ${issuedTicket.id}`
            );
          }
        }

        throw new Error(
          `Email send failed for ticket ${issuedTicket.id}: ${error}`
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
