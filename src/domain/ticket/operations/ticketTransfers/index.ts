import "server-only";

import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/services/prisma";
import { bustOnTicketTransferred, bustOnTicketIssued } from "@/lib/services/cache";
import { generateSecureHash } from "@/domain/ticket/operations/generateSecureHash";
import { transformToQrContent } from "@/domain/ticket/transformers/transformToQrContent";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  TicketTransferOfferTemplate,
  TicketTransferAcceptedTemplate,
} from "@/domain/email/templates";
import { getUserLocaleByEmail } from "@/domain/user/operations/getUserLocaleByEmail";
import { generateTicketImage } from "@/domain/ticket/operations/generateTicketImage";
import { sendTicketEmail } from "@/domain/email/operations/sendTicketEmail";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { splitArtistsIntoLines } from "@/domain/ticket/util";
import { formatEventDateAndTime, formatPrice } from "@/lib/util/formatting";
import type { TicketPayload } from "@/domain/ticket/types/ticket";

const TRANSFER_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class TicketTransferError extends Error {}

/** Eligibility shared by initiate + accept: unscanned, future, not a comp. */
async function assertTicketTransferable(ticket: {
  status: string;
  isGuestList: boolean;
  eventId: string;
}) {
  if (ticket.status !== "PENDING") {
    throw new TicketTransferError("Ticket is not transferable");
  }
  if (ticket.isGuestList) {
    throw new TicketTransferError("Guest-list tickets cannot be transferred");
  }
  const event = await fetchEventFromCmsById(ticket.eventId).catch(() => null);
  if (event?.date_start && event.date_start.getTime() < Date.now()) {
    throw new TicketTransferError("The event has already started");
  }
  return event;
}

export async function initiateTicketTransfer(input: {
  ticketId: string;
  senderUserId: string;
  recipientEmail: string;
}) {
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    throw new TicketTransferError("Invalid email address");
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: input.ticketId },
    include: {
      order: { select: { userId: true, email: true } },
      transfers: { where: { status: "PENDING" } },
    },
  });
  if (!ticket || ticket.order.userId !== input.senderUserId) {
    throw new TicketTransferError("Ticket not found");
  }
  if (ticket.transfers.some(t => t.expiresAt > new Date())) {
    throw new TicketTransferError("A transfer is already pending for this ticket");
  }

  const sender = await prisma.user.findUnique({
    where: { id: input.senderUserId },
    select: { email: true, name: true, username: true },
  });
  if (sender?.email && sender.email.toLowerCase() === recipientEmail) {
    throw new TicketTransferError("You cannot transfer a ticket to yourself");
  }

  const event = await assertTicketTransferable(ticket);

  // Expire at 7 days or event start, whichever comes first
  const ttlExpiry = new Date(Date.now() + TRANSFER_TTL_MS);
  const expiresAt =
    event?.date_start && event.date_start < ttlExpiry
      ? event.date_start
      : ttlExpiry;

  const transfer = await prisma.ticketTransfer.create({
    data: {
      ticketId: ticket.id,
      senderUserId: input.senderUserId,
      recipientEmail,
      token: randomBytes(32).toString("hex"),
      expiresAt,
    },
  });

  // Offer email — failure logs but doesn't undo the transfer (revocable)
  after(async () => {
    if (isBlockedEmail(recipientEmail)) return;
    const locale = await getUserLocaleByEmail(recipientEmail);
    await resend.emails
      .send({
        from: resendFromEmail,
        to: recipientEmail,
        subject:
          locale === "en"
            ? `A ticket for ${ticket.eventName} is waiting for you`
            : `Čaka te karta za ${ticket.eventName}`,
        react: TicketTransferOfferTemplate({
          senderName: sender?.name || sender?.username || "A friend",
          eventName: ticket.eventName,
          acceptUrl: `${PUBLIC_BASE_WEB_URL}/transfer/${transfer.token}`,
          expiresAt,
          locale,
        }),
      })
      .catch(error =>
        console.error("Failed to send transfer offer email:", error)
      );
  });

  return transfer;
}

export async function revokeTicketTransfer(
  transferId: string,
  senderUserId: string
) {
  const transfer = await prisma.ticketTransfer.findUnique({
    where: { id: transferId },
  });
  if (!transfer || transfer.senderUserId !== senderUserId) {
    throw new TicketTransferError("Transfer not found");
  }
  if (transfer.status !== "PENDING") {
    throw new TicketTransferError("Transfer is no longer pending");
  }
  return await prisma.ticketTransfer.update({
    where: { id: transferId },
    data: { status: "REVOKED" },
  });
}

export interface TransferForAccept {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  eventName: string;
  senderName: string;
  expiresAt: Date;
}

/** Load a transfer for the accept page; lazily marks expired offers. */
export async function getTicketTransferByToken(
  token: string
): Promise<TransferForAccept | null> {
  const transfer = await prisma.ticketTransfer.findUnique({
    where: { token },
    include: {
      ticket: { select: { eventName: true } },
      sender: { select: { name: true, username: true } },
    },
  });
  if (!transfer) return null;

  if (transfer.status === "PENDING" && transfer.expiresAt < new Date()) {
    await prisma.ticketTransfer.update({
      where: { id: transfer.id },
      data: { status: "EXPIRED" },
    });
    transfer.status = "EXPIRED";
  }

  return {
    id: transfer.id,
    status: transfer.status,
    eventName: transfer.ticket.eventName,
    senderName: transfer.sender.name || transfer.sender.username,
    expiresAt: transfer.expiresAt,
  };
}

/**
 * Accept: move the ticket to the accepting user via a fresh zero-value
 * order, regenerate the hash/QR (voiding the sender's copy), notify both
 * sides.
 */
export async function acceptTicketTransfer(
  token: string,
  acceptingUserId: string
) {
  const transfer = await prisma.ticketTransfer.findUnique({
    where: { token },
    include: {
      ticket: { include: { order: { select: { userId: true } } } },
      sender: { select: { id: true, email: true, name: true, username: true } },
    },
  });
  if (!transfer) throw new TicketTransferError("Transfer not found");
  if (transfer.status !== "PENDING") {
    throw new TicketTransferError("Transfer is no longer pending");
  }
  if (transfer.expiresAt < new Date()) {
    await prisma.ticketTransfer.update({
      where: { id: transfer.id },
      data: { status: "EXPIRED" },
    });
    throw new TicketTransferError("Transfer has expired");
  }
  if (transfer.senderUserId === acceptingUserId) {
    throw new TicketTransferError("You cannot accept your own transfer");
  }

  const ticket = transfer.ticket;
  await assertTicketTransferable(ticket);

  const acceptor = await prisma.user.findUnique({
    where: { id: acceptingUserId },
    select: { id: true, email: true, locale: true },
  });
  if (!acceptor?.email) {
    throw new TicketTransferError("Your account has no email address");
  }

  const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

  const { updatedTicket, qrContent } = await prisma.$transaction(async tx => {
    // Lightweight zero-value order so profile/stats queries keep working
    const transferOrder = await tx.order.create({
      data: {
        stripeSession: `transfer_${nanoid()}`,
        name: ticket.ticketHolderName,
        email: acceptor.email!,
        userId: acceptor.id,
        subtotal: 0,
        totalAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        shippingRequired: false,
        items: [],
        metadata: {
          isTicketTransfer: true,
          transferId: transfer.id,
          fromOrderId: ticket.orderId,
          fromUserId: transfer.senderUserId,
        },
        status: "COMPLETED",
      },
      select: { id: true },
    });

    // Fresh hash + QR: the sender's old QR/email/pass is void from here on
    const payload: TicketPayload = {
      shortId: ticket.shortId,
      eventId: ticket.eventId,
      eventName: ticket.eventName,
      ticketHolderName: ticket.ticketHolderName,
      ticketPayerEmail: acceptor.email!,
      orderId: transferOrder.id,
      price: Number(ticket.price),
    };
    const newHash = generateSecureHash(payload);
    const newQrContent = transformToQrContent(newHash, payload);

    const updated = await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        orderId: transferOrder.id,
        ticketPayerEmail: acceptor.email!,
        ticketHash: newHash,
        qrContent: JSON.parse(JSON.stringify(newQrContent)),
        metadata: {
          ...((ticket.metadata as object) ?? {}),
          transferredFromUserId: transfer.senderUserId,
          transferId: transfer.id,
        },
      },
    });

    await tx.ticketTransfer.update({
      where: { id: transfer.id },
      data: {
        status: "ACCEPTED",
        acceptedByUserId: acceptor.id,
        acceptedAt: new Date(),
      },
    });

    return { updatedTicket: updated, qrContent: newQrContent };
  });

  after(async () => {
    await bustOnTicketTransferred(
      ticket.id,
      transfer.senderUserId,
      acceptingUserId,
      ticket.eventId
    ).catch(() => {});
    await bustOnTicketIssued(ticket.id, acceptingUserId, ticket.eventId).catch(
      () => {}
    );

    // Fresh ticket (with the new QR) to the recipient — mirrors the
    // door-sale automation's image + email construction
    try {
      const eventData = await fetchEventFromCmsById(updatedTicket.eventId);
      if (eventData?.date_start) {
        const ticketLocale = acceptor.locale === "en" ? "en" : "sl";
        const image = await generateTicketImage({
          shortId: updatedTicket.shortId,
          hashId: updatedTicket.ticketHash,
          qrData: JSON.stringify(qrContent),
          eventName: updatedTicket.eventName,
          eventDetails: eventData.venue?.name ?? "",
          eventDate: formatEventDateAndTime(eventData.date_start, ticketLocale),
          attendeeName: updatedTicket.ticketHolderName,
          attendeeEmail: updatedTicket.ticketPayerEmail,
          artists: eventData.artists?.length
            ? splitArtistsIntoLines(eventData.artists.map(a => a.name))
            : [],
          price: formatPrice(Number(updatedTicket.price)),
          coverImageUrl: eventData.promoImage?.src ?? "",
          locale: ticketLocale,
          template: "default",
        });
        if (image) {
          await sendTicketEmail(
            {
              id: updatedTicket.id,
              shortId: updatedTicket.shortId,
              eventName: updatedTicket.eventName,
              ticketHolderName: updatedTicket.ticketHolderName,
              ticketPayerEmail: updatedTicket.ticketPayerEmail,
              qrContent: updatedTicket.qrContent,
              ticketHash: updatedTicket.ticketHash,
              eventCoverImageUrl: eventData.coverImage?.src || "",
              eventPromoImageUrl: eventData.promoImage?.src || "",
              eventDate: new Date(eventData.date_start),
              mapUrl: eventData.venue?.mapLocationUrl || "",
              address: eventData.venue?.address || "",
            },
            image,
            ticketLocale
          );
        }
      }
    } catch (error) {
      console.error("Failed to send transferred ticket email:", error);
    }

    // Acceptance confirmation to the sender
    if (transfer.sender.email && !isBlockedEmail(transfer.sender.email)) {
      const senderLocale = await getUserLocaleByEmail(transfer.sender.email);
      await resend.emails
        .send({
          from: resendFromEmail,
          to: transfer.sender.email,
          subject:
            senderLocale === "en"
              ? `Your ticket for ${ticket.eventName} was accepted`
              : `Tvoja karta za ${ticket.eventName} je bila sprejeta`,
          react: TicketTransferAcceptedTemplate({
            recipientEmail: transfer.recipientEmail,
            eventName: ticket.eventName,
            locale: senderLocale,
          }),
        })
        .catch(error =>
          console.error("Failed to send transfer accepted email:", error)
        );
    }
  });

  return updatedTicket;
}

/** Pending, unexpired offers addressed to this email (profile inbox). */
export async function getIncomingTicketTransfers(email: string) {
  return await prisma.ticketTransfer.findMany({
    where: {
      recipientEmail: email.toLowerCase(),
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    include: {
      ticket: { select: { eventName: true } },
      sender: { select: { name: true, username: true } },
    },
  });
}

/** Sender's pending transfers keyed by ticket id (profile ticket cards). */
export async function getOutgoingTicketTransfers(senderUserId: string) {
  return await prisma.ticketTransfer.findMany({
    where: {
      senderUserId,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      ticketId: true,
      recipientEmail: true,
      expiresAt: true,
    },
  });
}
