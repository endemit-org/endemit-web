import "server-only";

import { PKPass } from "passkit-generator";
import path from "path";
import { getCertificates } from "../../utils/certificates";
import { formatPrice, formatDate, formatTime } from "@/lib/util/formatting";
import { fetchStripImages } from "../getWalletStripUrls";

/**
 * What the pass should show.
 * - valid / used: barcode stays (re-entry, scan mistakes) — only STATUS changes
 * - cancelled / transferred: voided, no barcode, no personal details
 */
export type TicketPassState = "valid" | "used" | "cancelled" | "transferred";

export interface ApplePassTicketData {
  ticketId: string;
  shortId: string;
  ticketHash: string;
  eventId: string;
  eventName: string;
  eventDate: Date | null;
  /** Event end — the pass expires (Wallet hides it) 2 days after. */
  eventDateEnd?: Date | null;
  venueName: string | null;
  venueAddress: string | null;
  ticketHolderName: string;
  ticketPayerEmail: string;
  orderId: string;
  price: number;
  qrContent: string;
  locale?: "sl" | "en";
  state?: TicketPassState;
  /** PassKit web service — omitted → static pass that never updates. */
  webService?: { url: string; authenticationToken: string } | null;
}

const EXPIRY_AFTER_EVENT_MS = 2 * 24 * 60 * 60 * 1000;

// Pass field labels, keyed by ticket locale (mirrors the ticket-image approach —
// this runs outside the next-intl request scope).
const PASS_LABELS = {
  en: {
    attendee: "ATTENDEE",
    event: "EVENT",
    time: "TIME",
    venue: "VENUE",
    date: "DATE",
    status: "STATUS",
    // %@ is replaced by the new value on the lock-screen notification
    statusChange: "Ticket %@",
    states: {
      valid: "VALID",
      used: "USED",
      cancelled: "CANCELLED",
      transferred: "TRANSFERRED",
    },
    price: "Price",
    orderId: "Order ID",
    email: "Email",
    address: "Address",
    terms: "Terms & Conditions",
    termsText:
      "This ticket is valid for one person only. " +
      "Present this pass at the venue entrance. " +
      "This ticket is non-refundable, but transferable. ",
    support: "Support",
  },
  sl: {
    attendee: "IMETNIK",
    event: "EVENT",
    time: "URA",
    venue: "LOKACIJA",
    date: "DATUM",
    status: "STATUS",
    statusChange: "Karta: %@",
    states: {
      valid: "VELJAVNA",
      used: "UPORABLJENA",
      cancelled: "PREKLICANA",
      transferred: "PRENESENA",
    },
    price: "Cena",
    orderId: "Št. naročila",
    email: "Email",
    address: "Naslov",
    terms: "Pogoji",
    termsText:
      "Karta velja za eno osebo. " +
      "Pokaži jo ob vstopu na prizorišče. " +
      "Karta ni vračljiva, je pa prenosljiva. ",
    support: "Podpora",
  },
} as const;

/** Event end (or start, when no end is set) + 2 days. */
function getExpirationDate(data: ApplePassTicketData): Date | null {
  const base = data.eventDateEnd ?? data.eventDate;
  if (!base) return null;
  return new Date(new Date(base).getTime() + EXPIRY_AFTER_EVENT_MS);
}

export async function generateApplePass(
  data: ApplePassTicketData
): Promise<Buffer> {
  const labels = PASS_LABELS[data.locale ?? "sl"];
  const state: TicketPassState = data.state ?? "valid";
  const isVoided = state === "cancelled" || state === "transferred";
  const certificates = getCertificates();

  // Load the pass model from the passmodel.pass directory
  const passModelPath = path.join(
    process.cwd(),
    "src",
    "domain",
    "wallet-pass",
    "passmodel.pass"
  );

  let pass: PKPass;
  try {
    pass = await PKPass.from(
      {
        model: passModelPath,
        certificates: {
          wwdr: certificates.wwdr,
          signerCert: certificates.signerCert,
          signerKey: certificates.signerKey,
        },
      },
      {
        serialNumber: data.ticketId,
        description: `Ticket for ${data.eventName}`,
        ...(data.webService && {
          webServiceURL: data.webService.url,
          authenticationToken: data.webService.authenticationToken,
        }),
        ...(isVoided && { voided: true }),
      }
    );
  } catch (error) {
    console.error("PKPass.from error:", error);
    throw new Error(
      `Failed to create PKPass: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  if (!pass) {
    throw new Error("Failed to create PKPass - pass model may be invalid");
  }

  // Fetch and add dynamic strip images for this event
  const stripImages = await fetchStripImages(data.eventId);
  if (stripImages.strip3x) {
    pass.addBuffer("strip@3x.png", stripImages.strip3x);
  }
  if (stripImages.strip2x) {
    pass.addBuffer("strip@2x.png", stripImages.strip2x);
  }
  if (stripImages.strip) {
    pass.addBuffer("strip.png", stripImages.strip);
  }

  // Barcode (same QR as the physical ticket). A voided pass carries none, so
  // a cancelled or transferred-away ticket can't be shown at the door.
  if (!isVoided) {
    pass.setBarcodes({
      format: "PKBarcodeFormatQR",
      message: data.qrContent,
      messageEncoding: "utf-8",
      altText: data.shortId,
    });
  }

  // Set relevant date for lock screen notification
  if (data.eventDate) {
    pass.setRelevantDate(data.eventDate);
  }

  // Wallet moves the pass to "Expired Passes" after this, like boarding passes
  const expirationDate = getExpirationDate(data);
  if (expirationDate) {
    pass.setExpirationDate(expirationDate);
  }

  // Header fields (top right). A transferred-away pass no longer shows the
  // ticket row's holder — that's the new owner's data now.
  if (state !== "transferred") {
    pass.headerFields.push({
      key: "attendee",
      label: labels.attendee,
      value: data.ticketHolderName,
    });
  }

  // Secondary fields: EVENT, TIME
  pass.secondaryFields.push({
    key: "eventName",
    label: labels.event,
    value: data.eventName,
  });

  if (data.eventDate) {
    pass.secondaryFields.push({
      key: "time",
      label: labels.time,
      value: formatTime(data.eventDate),
    });
  }

  // Auxiliary fields: VENUE, DATE, STATUS
  if (data.venueName) {
    pass.auxiliaryFields.push({
      key: "venue",
      label: labels.venue,
      value: data.venueName,
    });
  }

  if (data.eventDate) {
    pass.auxiliaryFields.push({
      key: "date",
      label: labels.date,
      value: formatDate(data.eventDate, data.locale ?? "sl"),
    });
  }

  // Always present (even when VALID) so a later change triggers the
  // lock-screen notification via changeMessage
  pass.auxiliaryFields.push({
    key: "status",
    label: labels.status,
    value: labels.states[state],
    changeMessage: labels.statusChange,
  });

  // Back fields (information on the back of the pass)
  if (state !== "transferred") {
    pass.backFields.push({
      key: "price",
      label: labels.price,
      value: formatPrice(data.price),
    });

    pass.backFields.push({
      key: "orderId",
      label: labels.orderId,
      value: data.orderId,
    });

    pass.backFields.push({
      key: "email",
      label: labels.email,
      value: data.ticketPayerEmail,
    });
  }

  if (data.venueAddress) {
    pass.backFields.push({
      key: "address",
      label: labels.address,
      value: data.venueAddress,
    });
  }

  pass.backFields.push({
    key: "terms",
    label: labels.terms,
    value: labels.termsText,
  });

  pass.backFields.push({
    key: "support",
    label: labels.support,
    value: "endemit@endemit.org",
  });

  return pass.getAsBuffer();
}
