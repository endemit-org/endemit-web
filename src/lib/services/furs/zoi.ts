import "server-only";

import { createHash, createSign } from "node:crypto";
import { getFursCertificate } from "./cert";

export interface ZoiInput {
  taxNumber: string; // 8 digits
  issuedAt: Date;
  invoiceNumber: number;
  businessPremiseId: string;
  electronicDeviceId: string;
  amountCents: number; // negative for storno
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** ZDavPR sign-string date format: dd.MM.yyyy HH:mm:ss (local time) */
export function formatZoiDateTime(date: Date): string {
  return (
    `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}` +
    ` ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
  );
}

/** FURS message date format: yyyy-MM-ddTHH:mm:ss (local, no zone) */
export function formatFursDateTime(date: Date): string {
  return (
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` +
    `T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
  );
}

export function formatAmount(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

/**
 * ZOI (zaščitna oznaka izdajatelja): RSA-SHA256 signature of the concatenated
 * invoice data, MD5-hashed to 32 hex chars. Computed fully offline.
 */
export function computeZoi(input: ZoiInput): string {
  const { privateKeyPem } = getFursCertificate();

  const data =
    input.taxNumber +
    formatZoiDateTime(input.issuedAt) +
    String(input.invoiceNumber) +
    input.businessPremiseId +
    input.electronicDeviceId +
    formatAmount(input.amountCents);

  const signer = createSign("RSA-SHA256");
  signer.update(data, "utf8");
  const signature = signer.sign(privateKeyPem);

  return createHash("md5").update(signature).digest("hex");
}

/**
 * The 60-digit numeric value encoded in the receipt QR code:
 * ZOI as decimal (39 digits, zero-padded) + tax number (8) + yyMMddHHmmss
 * (12) + mod-10 control digit.
 */
export function buildFiscalQrValue(
  zoi: string,
  taxNumber: string,
  issuedAt: Date
): string {
  const zoiDecimal = BigInt(`0x${zoi}`).toString(10).padStart(39, "0");
  const dateTime =
    String(issuedAt.getFullYear()).slice(2) +
    pad2(issuedAt.getMonth() + 1) +
    pad2(issuedAt.getDate()) +
    pad2(issuedAt.getHours()) +
    pad2(issuedAt.getMinutes()) +
    pad2(issuedAt.getSeconds());

  const base = zoiDecimal + taxNumber + dateTime; // 59 digits
  const checkDigit =
    [...base].reduce((sum, digit) => sum + Number(digit), 0) % 10;

  return base + String(checkDigit);
}

/**
 * Full invoice number as it must appear on the receipt (ZDavPR):
 * `<premise>-<device>-<sequence>`, e.g. `EP1-BLAG1-127`. Uses the codes
 * stored on the invoice, not the current env, so old receipts stay correct.
 */
export function formatFiscalInvoiceNumber(invoice: {
  businessPremiseId: string;
  electronicDeviceId: string;
  invoiceNumber: number;
}): string {
  return `${invoice.businessPremiseId}-${invoice.electronicDeviceId}-${invoice.invoiceNumber}`;
}
