import "server-only";

import crypto from "crypto";
import { PASSKIT_AUTH_SECRET } from "@/lib/services/env/private";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import passModel from "../passmodel.pass/pass.json";

/** Pass Type ID baked into the ticket pass model (and the signing cert). */
export const TICKET_PASS_TYPE_ID: string = passModel.passTypeIdentifier;

/**
 * Base URL Apple Wallet calls for updates. Wallet appends `/v1/...` itself,
 * so the route handlers live under `/api/v1/passkit/v1/...`.
 * Null when updates are not configured — passes are then issued static.
 */
export function getPasskitWebServiceUrl(): string | null {
  if (!PASSKIT_AUTH_SECRET || !PUBLIC_BASE_WEB_URL) return null;
  // Apple only calls HTTPS web services
  if (!PUBLIC_BASE_WEB_URL.startsWith("https://")) return null;
  return `${PUBLIC_BASE_WEB_URL.replace(/\/$/, "")}/api/v1/passkit`;
}

/**
 * authenticationToken for a ticket pass. Bound to the ticket's orderId, which
 * changes when a ticket is transferred (new owner → new token) but not when
 * the holder name is edited (same owner keeps updating).
 */
export function ticketPassAuthToken(ticketId: string, orderId: string): string {
  if (!PASSKIT_AUTH_SECRET) {
    throw new Error("Missing PASSKIT_AUTH_SECRET");
  }
  return crypto
    .createHmac("sha256", PASSKIT_AUTH_SECRET)
    .update(`ticket-pass:${ticketId}:${orderId}`)
    .digest("hex");
}

/** Extracts the token from an `Authorization: ApplePass <token>` header. */
export function readApplePassToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = header.match(/^ApplePass\s+(\S+)$/);
  return match ? match[1] : null;
}

export function tokensEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}
