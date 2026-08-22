import "server-only";

import { createTranslator } from "next-intl";
import { prisma } from "@/lib/services/prisma";
import slMessages from "../../../../../messages/sl.json";
import { buildReceiptEposXml } from "@/lib/services/epos";
import { buildFiscalQrValue } from "@/lib/services/furs/zoi";
import { FURS_TAX_NUMBER } from "@/lib/services/env/private";
import { formatTokensFromCents } from "@/lib/util/currency";
import { formatEventDateAndTime } from "@/lib/util/formatting";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";

const COMPANY_LINES = [
  "Kulturno društvo Endemit",
  "Čečovje 4",
  "2390 Ravne na Koroškem",
];

/**
 * Render a paid POS order as ePOS-Print XML — the printed slip mirrors the
 * HTML receipt page (fiscal data, VAT clause, cut-separated ticket slips).
 * Paper receipts print in Slovenian.
 */
export async function renderPosReceiptEpos(
  posOrderId: string
): Promise<string | null> {
  const order = await prisma.posOrder.findUnique({
    where: { id: posOrderId },
    include: {
      items: true,
      register: { select: { name: true } },
      seller: { select: { name: true } },
      fiscalInvoices: { where: { isStorno: false }, take: 1 },
      tickets: {
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
        select: {
          shortId: true,
          eventId: true,
          eventName: true,
          qrContent: true,
        },
      },
    },
  });

  if (!order || order.status !== "PAID") return null;

  const t = createTranslator({
    locale: "sl",
    messages: slMessages,
    namespace: "pos.receipt",
  });

  const fiscalInvoice = order.fiscalInvoices[0] ?? null;

  // Ticket slips print only for anonymous sales (wallet buyers have their
  // profile QR), matching the HTML receipt
  const ticketEventIds = [...new Set(order.tickets.map(ticket => ticket.eventId))];
  const ticketEvents = new Map(
    (
      await Promise.all(
        ticketEventIds.map(async id => ({
          id,
          event: await fetchEventFromCmsById(id).catch(() => null),
        }))
      )
    ).map(({ id, event }) => [id, event])
  );

  const tickets =
    order.customerId === null
      ? order.tickets.map(ticket => {
          const cmsEvent = ticketEvents.get(ticket.eventId) ?? null;
          return {
            shortId: ticket.shortId,
            eventName: ticket.eventName,
            eventDate: cmsEvent?.date_start
              ? formatEventDateAndTime(cmsEvent.date_start)
              : null,
            venueName: cmsEvent?.venue?.name ?? null,
            qrData: JSON.stringify(ticket.qrContent),
          };
        })
      : [];

  const methodLabel =
    order.paymentMethod === "WALLET"
      ? t("methodWallet")
      : order.paymentMethod === "CASH"
        ? t("methodCash")
        : t("methodCard");

  return buildReceiptEposXml({
    registerName: order.register.name,
    companyLines: COMPANY_LINES,
    taxNumber: FURS_TAX_NUMBER,
    shortCode: order.shortCode,
    paidAt: order.paidAt ?? order.createdAt,
    sellerName: order.seller.name,
    items: order.items.map(item => ({
      quantity: item.quantity,
      name: item.name,
      total: formatTokensFromCents(item.total),
    })),
    tipLabel: order.tipAmount > 0 ? formatTokensFromCents(order.tipAmount) : null,
    totalFormatted: formatTokensFromCents(order.total),
    methodLabel,
    labels: {
      fiscalTitle: fiscalInvoice
        ? t("fiscalTitle", { number: fiscalInvoice.invoiceNumber })
        : undefined,
      informalTitle: t("informalTitle"),
      order: t("order"),
      date: t("date"),
      operator: t("operator"),
      tip: t("tip"),
      total: t("total"),
      paymentMethod: t("paymentMethod"),
      taxNumber: t("taxNumber"),
      eorPending: t("eorPending"),
      disclaimer: t("disclaimer"),
      thanks: t("thanks"),
      ticketsHint: t("ticketsHint"),
    },
    fiscal:
      fiscalInvoice && FURS_TAX_NUMBER
        ? {
            zoi: fiscalInvoice.zoi,
            eor: fiscalInvoice.eor,
            qrValue: buildFiscalQrValue(
              fiscalInvoice.zoi,
              FURS_TAX_NUMBER,
              fiscalInvoice.issuedAt
            ),
          }
        : null,
    vatClause: Boolean(fiscalInvoice),
    tickets,
  });
}
