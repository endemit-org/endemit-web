import "server-only";

import { inngest } from "@/lib/services/inngest";
import { prisma } from "@/lib/services/prisma";
import { isFursConfigured } from "@/lib/services/furs/cert";
import { submitInvoice } from "@/lib/services/furs/client";
import { buildInvoicePayload } from "@/lib/services/furs/invoice";

const MAX_ATTEMPTS = 10;
const BATCH_SIZE = 50;

/**
 * Submit pending/failed fiscal invoices to FURS (optionally only the given
 * ids) and store the EOR. Called inline right after payment so the printed
 * receipt carries the EOR, and by the Inngest sweep as the fallback.
 */
export async function submitPendingInvoices(invoiceIds?: string[]) {
  if (!isFursConfigured()) {
    return { submitted: 0, failed: 0, skipped: "FURS not configured" };
  }

  const invoices = await prisma.fiscalInvoice.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      attempts: { lt: MAX_ATTEMPTS },
      ...(invoiceIds && { id: { in: invoiceIds } }),
    },
    orderBy: { invoiceNumber: "asc" },
    take: BATCH_SIZE,
    include: {
      referenceInvoice: true,
      posOrder: {
        select: {
          seller: { select: { taxNumber: true } },
        },
      },
    },
  });

  let submitted = 0;
  let failed = 0;

  // Sequential submission — FURS rate limits, and order-by-number keeps the
  // audit trail tidy
  for (const invoice of invoices) {
    try {
      const eor = await submitInvoice(
        buildInvoicePayload({
          invoiceNumber: invoice.invoiceNumber,
          businessPremiseId: invoice.businessPremiseId,
          electronicDeviceId: invoice.electronicDeviceId,
          issuedAt: invoice.issuedAt,
          amount: invoice.amount,
          zoi: invoice.zoi,
          attempts: invoice.attempts,
          operatorTaxNumber: invoice.posOrder.seller.taxNumber,
          reference: invoice.referenceInvoice
            ? {
                invoiceNumber: invoice.referenceInvoice.invoiceNumber,
                businessPremiseId: invoice.referenceInvoice.businessPremiseId,
                electronicDeviceId: invoice.referenceInvoice.electronicDeviceId,
                issuedAt: invoice.referenceInvoice.issuedAt,
              }
            : null,
        })
      );

      await prisma.fiscalInvoice.update({
        where: { id: invoice.id },
        data: { eor, status: "SUBMITTED", lastError: null },
      });
      submitted++;
    } catch (error) {
      failed++;
      await prisma.fiscalInvoice.update({
        where: { id: invoice.id },
        data: {
          status: "FAILED",
          attempts: { increment: 1 },
          lastError:
            error instanceof Error ? error.message.slice(0, 500) : "Unknown",
        },
      });
    }
  }

  return { submitted, failed };
}

/**
 * Fallback submission of fiscal invoices to FURS: the payment request
 * already tried inline; this re-fires on each issued invoice and sweeps
 * every 10 minutes for anything still pending (legal window: 2 working
 * days).
 */
export const runFiscalSubmissionAutomation = inngest.createFunction(
  {
    id: "pos-fiscal-submission",
    retries: 3,
    // A single concurrent run avoids double-submitting the same invoice
    concurrency: { limit: 1 },
    triggers: [
      { event: "pos/fiscal.invoice.created" },
      { cron: "*/10 * * * *" },
    ],
  },
  async ({ step }) => {
    return await step.run("submit-pending-invoices", async () => {
      return await submitPendingInvoices();
    });
  }
);
