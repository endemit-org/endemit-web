import "server-only";

import { PKPass } from "passkit-generator";
import path from "path";
import { getCertificates } from "../../utils/certificates";
import { formatPrice, formatDate, formatTime } from "@/lib/util/formatting";
import { getWalletStripUrls, fetchStripImages } from "../getWalletStripUrls";

export interface ApplePassTicketData {
  ticketId: string;
  shortId: string;
  ticketHash: string;
  eventId: string;
  eventName: string;
  eventDate: Date | null;
  venueName: string | null;
  venueAddress: string | null;
  ticketHolderName: string;
  ticketPayerEmail: string;
  orderId: string;
  price: number;
  qrContent: string;
}

export async function generateApplePass(
  data: ApplePassTicketData
): Promise<Buffer> {
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

  // Set the barcode with the QR content (same as the physical ticket)
  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: data.qrContent,
    messageEncoding: "utf-8",
    altText: data.shortId,
  });

  // Set relevant date for lock screen notification
  if (data.eventDate) {
    pass.setRelevantDate(data.eventDate);
  }

  // Header fields (top right)
  pass.headerFields.push({
    key: "attendee",
    label: "ATTENDEE",
    value: data.ticketHolderName,
  });

  // Secondary fields: EVENT, TIME
  pass.secondaryFields.push({
    key: "eventName",
    label: "EVENT",
    value: data.eventName,
  });

  if (data.eventDate) {
    pass.secondaryFields.push({
      key: "time",
      label: "TIME",
      value: formatTime(data.eventDate),
    });
  }

  // Auxiliary fields: VENUE, DATE
  if (data.venueName) {
    pass.auxiliaryFields.push({
      key: "venue",
      label: "VENUE",
      value: data.venueName,
    });
  }

  if (data.eventDate) {
    pass.auxiliaryFields.push({
      key: "date",
      label: "DATE",
      value: formatDate(data.eventDate),
    });
  }

  // Back fields (information on the back of the pass)
  pass.backFields.push({
    key: "price",
    label: "Price",
    value: formatPrice(data.price),
  });

  pass.backFields.push({
    key: "orderId",
    label: "Order ID",
    value: data.orderId,
  });

  pass.backFields.push({
    key: "email",
    label: "Email",
    value: data.ticketPayerEmail,
  });

  if (data.venueAddress) {
    pass.backFields.push({
      key: "address",
      label: "Address",
      value: data.venueAddress,
    });
  }

  pass.backFields.push({
    key: "terms",
    label: "Terms & Conditions",
    value:
      "This ticket is valid for one person only. " +
      "Present this pass at the venue entrance. " +
      "This ticket is non-refundable, but transferable. ",
  });

  pass.backFields.push({
    key: "support",
    label: "Support",
    value: "endemit@endemit.org",
  });

  return pass.getAsBuffer();
}
