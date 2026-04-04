import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { prisma } from "@/lib/services/prisma";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { sendEventReminderEmail } from "@/domain/email/operations/sendEventReminderEmail";
import { generateTicketImage } from "@/domain/ticket/operations/generateTicketImage";
import { splitArtistsIntoLines } from "@/domain/ticket/util";
import {
  formatEventDateAndTime,
  formatPrice,
  sanitizeForFilename,
} from "@/lib/util/formatting";
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
 * Test endpoint for event reminder emails.
 *
 * POST /api/v1/admin/test-event-reminder
 * Body: {
 *   eventId: string,        // Required: Prismic event ID
 *   email?: string,         // Optional: Filter to tickets for this email AND send to this email
 *   limit?: number          // Optional: Limit number of emails to send (default: 1, ignored if email is set)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Require TICKETS_CREATE permission (admin-level)
    if (!user.permissions.includes(PERMISSIONS.TICKETS_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      eventId,
      email,
      limit = 1,
    } = body as {
      eventId: string;
      email?: string;
      limit?: number;
    };

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    // Fetch event from CMS
    const event = await fetchEventFromCmsById(eventId);

    if (!event) {
      return NextResponse.json(
        { error: `Event not found: ${eventId}` },
        { status: 404 }
      );
    }

    if (!event.date_start) {
      return NextResponse.json(
        { error: "Event has no start date" },
        { status: 400 }
      );
    }

    // Get tickets for this event with full data for image generation
    // If email is provided, filter to only that email's tickets
    const tickets = await prisma.ticket.findMany({
      where: {
        eventId: event.id,
        status: {
          in: [TicketStatus.VALIDATED, TicketStatus.PENDING],
        },
        ...(email && { ticketPayerEmail: email }),
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
      return NextResponse.json(
        { error: "No valid tickets found for this event" },
        { status: 404 }
      );
    }

    // Group tickets by payer email
    const ticketsByEmail = tickets.reduce(
      (acc, ticket) => {
        const email = ticket.ticketPayerEmail;
        if (!acc[email]) {
          acc[email] = [];
        }
        acc[email].push(ticket);
        return acc;
      },
      {} as Record<string, TicketData[]>
    );

    const emailGroups = Object.entries(ticketsByEmail);
    // If specific email provided, send all (should be just 1 group), otherwise respect limit
    const emailsToSend = email ? emailGroups : emailGroups.slice(0, limit);

    const results: Array<{
      email: string;
      ticketCount: number;
      success: boolean;
      error?: string;
    }> = [];

    // Prepare event data
    const eventData = {
      name: event.name,
      date: event.date_start,
      promoImageUrl: event.promoImage?.src ?? "",
      venue: event.venue
        ? {
            name: event.venue.name ?? "",
            address: event.venue.address ?? "",
            mapUrl: event.venue.mapLocationUrl ?? "",
          }
        : { name: "", address: "", mapUrl: "" },
      artists:
        event.artists
          ?.filter((a): a is NonNullable<typeof a> => a !== null)
          .map(a => ({ name: a.name ?? "" })) ?? [],
    };

    // Prepare data for image generation
    const formattedDate = formatEventDateAndTime(eventData.date);
    const artistNames = eventData.artists.map(a => a.name);
    const artistLines = splitArtistsIntoLines(artistNames);

    // Send test emails
    for (const [originalEmail, recipientTickets] of emailsToSend) {
      const targetEmail = originalEmail;

      try {
        // Generate ticket images for all tickets
        const attachments = await Promise.all(
          recipientTickets.map(async ticket => {
            const templateId = (
              ticket.metadata as Record<string, unknown> | null
            )?.ticketTemplate as string | undefined;

            const imageBase64 = await generateTicketImage({
              shortId: ticket.shortId,
              hashId: ticket.ticketHash,
              qrData: JSON.stringify(ticket.qrContent),
              eventName: eventData.name,
              eventDetails: eventData.venue.name,
              eventDate: formattedDate,
              attendeeName: ticket.ticketHolderName,
              attendeeEmail: ticket.ticketPayerEmail,
              artists: artistLines,
              price: formatPrice(Number(ticket.price)),
              coverImageUrl: eventData.promoImageUrl,
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
          recipientEmail: targetEmail,
          eventName: eventData.name,
          eventDate: eventData.date,
          eventPromoImageUrl: eventData.promoImageUrl,
          venue: eventData.venue,
          artists: eventData.artists,
          tickets: recipientTickets.map(t => ({
            shortId: t.shortId,
            ticketHash: t.ticketHash,
            ticketHolderName: t.ticketHolderName,
            ticketPayerEmail: t.ticketPayerEmail,
            price: Number(t.price),
            qrContent: t.qrContent,
            metadata: t.metadata as Record<string, unknown> | null,
          })),
          attachments,
        });

        results.push({
          email: targetEmail,
          ticketCount: recipientTickets.length,
          success: true,
        });
      } catch (error) {
        results.push({
          email: targetEmail,
          ticketCount: recipientTickets.length,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        date: event.date_start,
      },
      totalTickets: tickets.length,
      uniqueEmails: emailGroups.length,
      emailsSent: results.filter(r => r.success).length,
      results,
    });
  } catch (error) {
    console.error("Test event reminder error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to send test reminder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
