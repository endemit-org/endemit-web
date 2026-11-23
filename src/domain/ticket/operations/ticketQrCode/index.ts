import "server-only";

import crypto from "crypto";
import { TICKET_SECRET } from "@/lib/services/env/private";

/**
 * Compact ticket QR code: `E2.<shortId>.<mac>`.
 *
 * Only uppercase letters, digits and "." so the QR encoder stays in
 * alphanumeric mode: 24 characters fit a version 2 symbol (25×25 modules),
 * which phones read from a screen at arm's length. Everything the door needs
 * to display (holder, email, price) comes from the server on scan.
 *
 * The MAC covers the ticket's current orderId without carrying it: a transfer
 * moves the ticket to a new order, so every code issued to the previous owner
 * (email, PNG, Wallet pass, screenshot) stops verifying.
 */
const VERSION = "E2";
const MAC_BYTES = 10; // 80 bits → exactly 16 base32 characters
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const CODE_PATTERN = /^E2\.([A-Z0-9]{1,12})\.([A-Z2-7]{16})$/;

const toBase32 = (bytes: Buffer) => {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
};

const computeMac = (shortId: string, orderId: string) => {
  if (!TICKET_SECRET) {
    throw new Error("Missing security parameters on ticket QR code");
  }

  const digest = crypto
    .createHmac("sha256", TICKET_SECRET)
    .update(`${VERSION}|${shortId}|${orderId}`)
    .digest();

  return toBase32(digest.subarray(0, MAC_BYTES));
};

export const buildTicketQrCode = (ticket: {
  shortId: string;
  orderId: string;
}) => `${VERSION}.${ticket.shortId}.${computeMac(ticket.shortId, ticket.orderId)}`;

export const parseTicketQrCode = (raw: string) => {
  const match = CODE_PATTERN.exec(raw.trim().toUpperCase());
  if (!match) return null;

  return { shortId: match[1], mac: match[2] };
};

export const verifyTicketQrMac = (
  mac: string,
  ticket: { shortId: string; orderId: string }
) => {
  const expected = Buffer.from(computeMac(ticket.shortId, ticket.orderId));
  const received = Buffer.from(mac);

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
};
