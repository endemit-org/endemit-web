import "server-only";

import { inngest } from "@/lib/services/inngest";
import { sendEventReminderEmail } from "@/domain/email/operations/sendEventReminderEmail";
import { generateTicketImage } from "@/domain/ticket/operations/generateTicketImage";
import { splitArtistsIntoLines } from "@/domain/ticket/util";
import {
  formatEventDateAndTime,
  formatPrice,
  sanitizeForFilename,
} from "@/lib/util/formatting";
import { EmailQueueEvent, EventReminderData } from "@/domain/email/types/email";

/**
 * Worker function that sends a single event reminder email.
 * Called by the dispatcher (runEventReminderAutomation) for each recipient.
 */
export const runSingleEventReminderAutomation = inngest.createFunction(
  {
    id: "send-single-event-reminder",
    retries: 3,
    triggers: [{ event: EmailQueueEvent.SEND_EVENT_REMINDER }],
  },
  async ({ event, step }) => {
    const data = event.data as EventReminderData;

    const {
      recipientEmail,
      eventId,
      eventName,
      eventDate,
      eventPromoImageUrl,
      venue,
      artists,
      tickets,
    } = data;

    const parsedEventDate = new Date(eventDate);
    const formattedDate = formatEventDateAndTime(parsedEventDate);
    const artistNames = artists.map(a => a.name);
    const artistLines = splitArtistsIntoLines(artistNames);

    // Generate ticket images and send email in a single step
    // to avoid serializing large base64 images between steps
    await step.run("generate-and-send-email", async () => {
      const attachments = await Promise.all(
        tickets.map(async ticket => {
          const templateId = ticket.metadata?.ticketTemplate as
            | string
            | undefined;

          const imageBase64 = await generateTicketImage({
            shortId: ticket.shortId,
            hashId: ticket.ticketHash,
            qrData: JSON.stringify(ticket.qrContent),
            eventName,
            eventDetails: venue.name,
            eventDate: formattedDate,
            attendeeName: ticket.ticketHolderName,
            attendeeEmail: ticket.ticketPayerEmail,
            artists: artistLines,
            price: formatPrice(ticket.price),
            coverImageUrl: eventPromoImageUrl,
            template: templateId,
          });

          const sanitizedName = sanitizeForFilename(ticket.ticketHolderName);

          return {
            filename: `ticket-${ticket.shortId}-${sanitizedName}.png`,
            content: imageBase64,
          };
        })
      );

      await sendEventReminderEmail({
        recipientEmail,
        eventName,
        eventDate: parsedEventDate,
        eventPromoImageUrl,
        venue,
        artists,
        tickets,
        attachments,
      });
    });

    return {
      success: true,
      recipientEmail,
      eventId,
      ticketCount: tickets.length,
    };
  }
);
