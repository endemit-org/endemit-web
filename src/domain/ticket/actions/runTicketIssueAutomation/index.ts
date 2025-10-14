import { inngest } from "@/services/inngest";
import { TicketCreationData, TicketQueueEvent } from "@/types/ticket";
import {
  createTicketTransaction,
  generateQrContent,
  generateSecureHash,
  generateTicketImage,
} from "@/domain/ticket/actions";
import { sendTicketEmail } from "@/domain/email/actions";
import { notifyOnNewTicketIssue } from "@/domain/notification/actions";

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
        const hash = generateSecureHash({
          eventId,
          eventName,
          ticketHolderName,
          ticketPayerEmail,
          orderId,
        });

        const qrData = generateQrContent(hash, {
          eventId,
          eventName,
          ticketHolderName,
          ticketPayerEmail,
          orderId,
        });

        if (!hash || !qrData) {
          throw new Error("Failed to generate ticket security data");
        }

        return { ticketHash: hash, qrContent: qrData };
      }
    );

    const ticketTransaction = await step.run("create-ticket-db", async () => {
      const created = await createTicketTransaction({
        eventId,
        eventName,
        price,
        ticketHolderName,
        ticketPayerEmail,
        ticketHash: ticketSecurityData.ticketHash,
        qrContent: JSON.stringify(ticketSecurityData.qrContent),
        orderId,
        metadata: JSON.stringify(metadata),
      });

      if (!created) {
        throw new Error("Failed to create ticket in database");
      }

      return created;
    });

    const ticketImage = await step.run("create-ticket-image", async () => {
      const image = await generateTicketImage(
        JSON.stringify(ticketSecurityData)
      );

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
