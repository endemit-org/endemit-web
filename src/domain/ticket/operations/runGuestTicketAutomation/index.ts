import "server-only";

import { inngest } from "@/lib/services/inngest";
import { TicketQueueEvent } from "@/domain/ticket/types/ticket";
import { formatEventDateAndTime, formatPrice } from "@/lib/util/formatting";
import { splitArtistsIntoLines } from "@/domain/ticket/util";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { generateTicketImage } from "@/domain/ticket/operations/generateTicketImage";
import { sendTicketEmail } from "@/domain/email/operations/sendTicketEmail";
import { notifyOnGuestTicketIssue } from "@/domain/notification/operations/notifyOnGuestTicketIssue";
import { prisma } from "@/lib/services/prisma";

export interface GuestTicketProcessData {
  ticketId: string;
  eventId: string;
  eventName: string;
  ticketHolderName: string;
  ticketHolderEmail: string;
  sendEmail: boolean;
  // Batch info for Discord notification
  batchId: string;
  batchSize: number;
  batchIndex: number;
  allHolderNames: string;
  createdByUserName: string;
}

export const runGuestTicketAutomation = inngest.createFunction(
  {
    id: "process-guest-ticket-function",
    retries: 5,
    triggers: [{ event: TicketQueueEvent.PROCESS_GUEST_TICKET }],
  },
  async ({ event, step }) => {
    const {
      ticketId,
      eventId,
      eventName,
      ticketHolderEmail,
      sendEmail,
      batchSize,
      batchIndex,
      allHolderNames,
      createdByUserName,
    } = event.data as GuestTicketProcessData;

    // Get the ticket from database
    const ticket = await step.run("get-ticket", async () => {
      const t = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!t) {
        throw new Error(`Ticket ${ticketId} not found`);
      }

      return t;
    });

    // Send Discord notification only for the first ticket in the batch
    if (batchIndex === 0) {
      await step.run("send-discord-notification", async () => {
        const guestTicketCount = await prisma.ticket.count({
          where: { eventId, isGuestList: true },
        });

        return await notifyOnGuestTicketIssue({
          eventName,
          ticketHolderEmail,
          ticketHolderName: allHolderNames,
          ticketCount: batchSize,
          totalGuestTicketsForEvent: guestTicketCount,
          createdByUserName,
        });
      });
    }

    // Generate and send email if requested
    if (sendEmail) {
      const ticketImageWithEvent = await step.run(
        "create-ticket-image",
        async () => {
          const eventData = await fetchEventFromCmsById(eventId);

          if (
            !eventData?.promoImage?.src ||
            !eventData?.date_start ||
            !eventData?.venue
          ) {
            throw new Error("Missing event data for ticket image generation");
          }

          // Only include artists if lineup is shown
          const artistNames = eventData.options.showEventLineup && eventData.artists?.length > 0
            ? splitArtistsIntoLines(eventData.artists.map(artist => artist.name))
            : [];

          const image = await generateTicketImage({
            shortId: ticket.shortId,
            hashId: ticket.ticketHash,
            qrData: JSON.stringify(ticket.qrContent),
            eventName: ticket.eventName,
            eventDetails: eventData.venue.name ?? "",
            eventDate: formatEventDateAndTime(eventData.date_start),
            attendeeName: ticket.ticketHolderName,
            attendeeEmail: ticket.ticketPayerEmail,
            artists: artistNames,
            price: formatPrice(Number(ticket.price)),
            coverImageUrl: eventData.promoImage.src,
            template: "guest",
          });

          if (!image) {
            throw new Error("Failed to generate ticket image");
          }

          return { image, event: eventData };
        }
      );

      await step.run("send-ticket-email", async () => {
        if (!ticketImageWithEvent.event.date_start) {
          throw new Error("Event date is missing for ticket email");
        }

        const result = await sendTicketEmail(
          {
            id: ticket.id,
            shortId: ticket.shortId,
            eventName: ticket.eventName,
            ticketHolderName: ticket.ticketHolderName,
            ticketPayerEmail: ticket.ticketPayerEmail,
            qrContent: ticket.qrContent,
            ticketHash: ticket.ticketHash,
            eventCoverImageUrl:
              ticketImageWithEvent.event.coverImage?.src || "",
            eventPromoImageUrl: ticketImageWithEvent.event.promoImage?.src || "",
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
      });
    }

    return { ticketId, processed: true, emailSent: sendEmail };
  }
);
