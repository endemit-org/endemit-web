import "server-only";

import { inngest } from "@/lib/services/inngest";
import { prisma } from "@/lib/services/prisma";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { queueEventReminderEmail } from "@/domain/email/operations/queueEventReminderEmail";
import { TicketStatus, Prisma } from "@prisma/client";

interface TicketData {
  shortId: string;
  ticketHash: string;
  ticketHolderName: string;
  ticketPayerEmail: string;
  price: Prisma.Decimal;
  qrContent: Prisma.JsonValue;
  metadata: Prisma.JsonValue;
}

/**
 * Scheduled dispatcher that queues event reminder emails at 6pm Ljubljana time
 * for events happening the next day.
 *
 * This is a dispatcher only - it queues individual emails to be sent by
 * runSingleEventReminderAutomation. Uses idempotent event IDs to prevent
 * duplicate emails if the dispatcher runs multiple times.
 */
export const runEventReminderAutomation = inngest.createFunction(
  {
    id: "run-event-reminder-automation",
    retries: 3,
    triggers: [{ cron: "TZ=Europe/Ljubljana 30 17 * * *" }], // 5:30pm Ljubljana daily
  },
  async ({ step }) => {
    // Get today's date for idempotency key
    const reminderDate = await step.run("get-reminder-date", async () => {
      const ljubljanaFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Ljubljana",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      return ljubljanaFormatter.format(new Date());
    });

    // Step 1: Find events happening tomorrow
    const tomorrowEvents = await step.run("find-tomorrow-events", async () => {
      const events = await fetchEventsFromCms({ pageSize: 100 });

      if (!events) {
        return [];
      }

      // Get tomorrow's date in Ljubljana timezone
      const now = new Date();
      const ljubljanaFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Ljubljana",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      // Get tomorrow in Ljubljana timezone
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = ljubljanaFormatter.format(tomorrow);

      // Filter events that start tomorrow
      const filteredEvents = events.filter(event => {
        if (!event.date_start) return false;
        const eventDateStr = ljubljanaFormatter.format(event.date_start);
        return eventDateStr === tomorrowStr;
      });

      // Return serializable data
      return filteredEvents.map(event => ({
        id: event.id,
        name: event.name,
        date_start: event.date_start?.toISOString() ?? null,
        promoImageUrl: event.promoImage?.src ?? null,
        venue: event.venue
          ? {
              name: event.venue.name ?? "",
              address: event.venue.address ?? "",
              mapUrl: event.venue.mapLocationUrl ?? "",
            }
          : null,
        // Only include artists if lineup is shown
        artists: event.options.showEventLineup
          ? (event.artists
              ?.filter((a): a is NonNullable<typeof a> => a !== null)
              .map(a => ({ name: a.name ?? "" })) ?? [])
          : [],
      }));
    });

    if (tomorrowEvents.length === 0) {
      return { success: true, message: "No events tomorrow", emailsQueued: 0 };
    }

    let totalEmailsQueued = 0;

    // Step 2: For each event, get tickets and queue reminder emails
    for (const event of tomorrowEvents) {
      const emailsForEvent = await step.run(
        `queue-reminders-${event.id}`,
        async () => {
          // Get all valid tickets for this event
          const tickets = await prisma.ticket.findMany({
            where: {
              eventId: event.id,
              status: {
                in: [TicketStatus.VALIDATED, TicketStatus.PENDING],
              },
            },
            select: {
              shortId: true,
              ticketHash: true,
              ticketHolderName: true,
              ticketPayerEmail: true,
              price: true,
              qrContent: true,
              metadata: true,
            },
          });

          if (tickets.length === 0) {
            return 0;
          }

          // Group tickets by payer email (one email per recipient)
          const ticketsByEmail = tickets.reduce(
            (acc, ticket) => {
              const email = ticket.ticketPayerEmail.toLowerCase();
              if (!acc[email]) {
                acc[email] = [];
              }
              acc[email].push(ticket);
              return acc;
            },
            {} as Record<string, TicketData[]>
          );

          let emailsQueued = 0;
          const DELAY_BETWEEN_EMAILS_SECONDS = 5;

          // Queue email for each unique payer with staggered delays
          for (const [recipientEmail, recipientTickets] of Object.entries(
            ticketsByEmail
          )) {
            await queueEventReminderEmail(
              {
                recipientEmail,
                eventId: event.id,
                eventName: event.name,
                eventDate: event.date_start!,
                eventPromoImageUrl: event.promoImageUrl ?? "",
                venue: event.venue ?? {
                  name: "",
                  address: "",
                  mapUrl: "",
                },
                artists: event.artists,
                tickets: recipientTickets.map(t => ({
                  shortId: t.shortId,
                  ticketHash: t.ticketHash,
                  ticketHolderName: t.ticketHolderName,
                  ticketPayerEmail: t.ticketPayerEmail,
                  price: Number(t.price),
                  qrContent: t.qrContent,
                  metadata: t.metadata as Record<string, unknown> | null,
                })),
              },
              reminderDate,
              emailsQueued * DELAY_BETWEEN_EMAILS_SECONDS
            );

            emailsQueued++;
          }

          return emailsQueued;
        }
      );

      totalEmailsQueued += emailsForEvent;
    }

    return {
      success: true,
      eventsProcessed: tomorrowEvents.length,
      emailsQueued: totalEmailsQueued,
    };
  }
);
