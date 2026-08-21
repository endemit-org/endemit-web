import "server-only";

import { FURS_TAX_NUMBER } from "@/lib/services/env/private";
import { formatFursDateTime } from "./zoi";

export interface FiscalInvoiceForSubmission {
  invoiceNumber: number;
  businessPremiseId: string;
  electronicDeviceId: string;
  issuedAt: Date;
  amount: number; // cents, negative for storno
  zoi: string;
  attempts: number;
  operatorTaxNumber?: string | null;
  reference?: {
    invoiceNumber: number;
    businessPremiseId: string;
    electronicDeviceId: string;
    issuedAt: Date;
  } | null;
}

export function getFursTaxNumber(): string {
  if (!FURS_TAX_NUMBER) {
    throw new Error("FURS_TAX_NUMBER is not configured");
  }
  return FURS_TAX_NUMBER;
}

/**
 * Build the FURS Invoice message body. We are not VAT-registered, so the
 * whole amount goes under ExemptVATTaxableAmount.
 */
export function buildInvoicePayload(
  invoice: FiscalInvoiceForSubmission
): Record<string, unknown> {
  const taxNumber = Number(getFursTaxNumber());
  const amount = invoice.amount / 100;

  return {
    TaxNumber: taxNumber,
    IssueDateTime: formatFursDateTime(invoice.issuedAt),
    NumberingStructure: "C",
    InvoiceIdentifier: {
      BusinessPremiseID: invoice.businessPremiseId,
      ElectronicDeviceID: invoice.electronicDeviceId,
      InvoiceNumber: String(invoice.invoiceNumber),
    },
    InvoiceAmount: amount,
    PaymentAmount: amount,
    TaxesPerSeller: [
      {
        ExemptVATTaxableAmount: amount,
      },
    ],
    ...(invoice.operatorTaxNumber && {
      OperatorTaxNumber: Number(invoice.operatorTaxNumber),
    }),
    ProtectedID: invoice.zoi,
    // Legally required flag when the invoice is submitted after issue time
    // (offline/bulk confirmation path)
    ...(invoice.attempts > 0 && { SubsequentSubmit: true }),
    ...(invoice.reference && {
      ReferenceInvoice: [
        {
          ReferenceInvoiceIdentifier: {
            BusinessPremiseID: invoice.reference.businessPremiseId,
            ElectronicDeviceID: invoice.reference.electronicDeviceId,
            InvoiceNumber: String(invoice.reference.invoiceNumber),
          },
          ReferenceInvoiceIssueDateTime: formatFursDateTime(
            invoice.reference.issuedAt
          ),
        },
      ],
    }),
  };
}
