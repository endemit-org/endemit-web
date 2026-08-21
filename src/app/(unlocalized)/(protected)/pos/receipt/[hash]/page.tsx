import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/services/prisma";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { formatTokensFromCents } from "@/lib/util/currency";
import { buildFiscalQrValue } from "@/lib/services/furs/zoi";
import { FURS_TAX_NUMBER } from "@/lib/services/env/private";
import ReceiptPrintButton from "@/app/_components/pos/ReceiptPrintButton";
import EndemitLogo from "@/app/_components/icon/EndemitLogo";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { formatEventDateAndTime } from "@/lib/util/formatting";

export const metadata: Metadata = {
  title: "Receipt",
  robots: { index: false, follow: false },
};

export default async function PosReceiptPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin?redirect=/pos");
  }

  const { hash } = await params;
  const order = await prisma.posOrder.findUnique({
    where: { orderHash: hash },
    include: {
      items: true,
      register: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      fiscalInvoices: {
        where: { isStorno: false },
        take: 1,
      },
      tickets: {
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
        select: {
          id: true,
          shortId: true,
          eventId: true,
          eventName: true,
          qrContent: true,
        },
      },
    },
  });

  if (!order || order.status !== "PAID") {
    notFound();
  }

  // Seller of the order, any seller assigned to the register, admins with
  // order read access, or the order's customer
  const isAuthorized =
    order.sellerId === user.id ||
    order.customerId === user.id ||
    user.permissions.includes(PERMISSIONS.POS_ORDERS_READ) ||
    Boolean(
      await prisma.posRegisterSeller.findFirst({
        where: { registerId: order.register.id, userId: user.id },
        select: { id: true },
      })
    );
  if (!isAuthorized) {
    redirect("/pos");
  }

  const t = await getTranslations("pos.receipt");
  const fiscalInvoice = order.fiscalInvoices[0] ?? null;

  let fiscalQrDataUrl: string | null = null;
  if (fiscalInvoice && FURS_TAX_NUMBER) {
    const qrValue = buildFiscalQrValue(
      fiscalInvoice.zoi,
      FURS_TAX_NUMBER,
      fiscalInvoice.issuedAt
    );
    fiscalQrDataUrl = await QRCode.toDataURL(qrValue, {
      width: 160,
      margin: 0,
    });
  }

  // The slip doubles as the entry ticket for anonymous sales; wallet buyers
  // carry their tickets in their profile. Event date/venue enrich the slip.
  const ticketEventIds = [...new Set(order.tickets.map(t => t.eventId))];
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

  const ticketQrs =
    order.customerId === null
      ? await Promise.all(
          order.tickets.map(async ticket => {
            const cmsEvent = ticketEvents.get(ticket.eventId) ?? null;
            return {
              shortId: ticket.shortId,
              eventName: ticket.eventName,
              eventDate: cmsEvent?.date_start
                ? formatEventDateAndTime(cmsEvent.date_start)
                : null,
              venueName: cmsEvent?.venue?.name ?? null,
              dataUrl: await QRCode.toDataURL(
                JSON.stringify(ticket.qrContent),
                {
                  width: 200,
                  margin: 0,
                }
              ),
            };
          })
        )
      : [];

  const methodLabel =
    order.paymentMethod === "WALLET"
      ? t("methodWallet")
      : order.paymentMethod === "CASH"
        ? t("methodCash")
        : t("methodCard");

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-6 print:bg-white print:py-0">
      {/* 80mm receipt column */}
      <div
        className="bg-white text-black font-mono text-[12px] leading-snug p-4 shadow print:shadow-none"
        style={{ width: "80mm" }}
      >
        <div className="text-center mb-3">
          <div className="w-[45mm] mx-auto mb-2 text-black">
            <EndemitLogo />
          </div>
          <div>{order.register.name}</div>
          {fiscalInvoice ? (
            <div className="font-bold mt-2">
              {t("fiscalTitle", { number: fiscalInvoice.invoiceNumber })}
            </div>
          ) : (
            <div className="font-bold mt-2">{t("informalTitle")}</div>
          )}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="flex justify-between">
          <span>{t("order")}</span>
          <span>{order.shortCode}</span>
        </div>
        <div className="flex justify-between">
          <span>{t("date")}</span>
          <span>
            {(order.paidAt ?? order.createdAt).toLocaleString("sl-SI", {
              dateStyle: "short",
              timeStyle: "medium",
            })}
          </span>
        </div>
        {order.seller.name && (
          <div className="flex justify-between">
            <span>{t("operator")}</span>
            <span>{order.seller.name}</span>
          </div>
        )}

        <div className="border-t border-dashed border-black my-2" />

        {order.items.map(item => (
          <div key={item.id} className="flex justify-between gap-2">
            <span>
              {item.quantity}x {item.name}
            </span>
            <span className="whitespace-nowrap">
              {formatTokensFromCents(item.total)}
            </span>
          </div>
        ))}
        {order.tipAmount > 0 && (
          <div className="flex justify-between">
            <span>{t("tip")}</span>
            <span>{formatTokensFromCents(order.tipAmount)}</span>
          </div>
        )}

        <div className="border-t border-dashed border-black my-2" />

        <div className="flex justify-between font-bold text-[14px]">
          <span>{t("total")}</span>
          <span>{formatTokensFromCents(order.total)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t("paymentMethod")}</span>
          <span>{methodLabel}</span>
        </div>

        {fiscalInvoice && (
          <>
            <div className="border-t border-dashed border-black my-2" />
            {FURS_TAX_NUMBER && (
              <div className="flex justify-between">
                <span>{t("taxNumber")}</span>
                <span>{FURS_TAX_NUMBER}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 min-w-0 text-[9px] leading-tight">
                <div className="break-all">ZOI: {fiscalInvoice.zoi}</div>
                <div className="break-all">
                  EOR: {fiscalInvoice.eor ?? t("eorPending")}
                </div>
              </div>
              {fiscalQrDataUrl && (
                /* Legal minimum for the printed FURS QR is 2×2 cm — keep it
                   just above that */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={fiscalQrDataUrl}
                  alt="FURS QR"
                  className="w-[22mm] h-[22mm] flex-shrink-0"
                  width={160}
                  height={160}
                />
              )}
            </div>
            {/* Legally required VAT-exemption clause (mali davčni zavezanec) —
                fixed statutory wording, always in both languages */}
            <div className="mt-2 text-[10px] text-center">
              DDV ni obračunan na podlagi 1. odstavka 94. člena ZDDV-1.
            </div>
            <div className="text-[10px] text-center">
              VAT not charged pursuant to Article 94(1) of the Slovenian VAT
              Act (ZDDV-1).
            </div>
          </>
        )}

        {!fiscalInvoice && (
          <>
            <div className="border-t border-dashed border-black my-2" />
            <div className="text-center text-[10px]">{t("disclaimer")}</div>
          </>
        )}

        {ticketQrs.length > 0 && (
          <>
            <div className="border-t border-dashed border-black mt-4 mb-3" />
            <div className="text-center font-bold uppercase text-[12px] mb-4">
              {t("ticketsHeading")}
            </div>
            {ticketQrs.map(ticket => (
              <div key={ticket.shortId} className="text-center mb-6">
                <div className="font-bold text-[13px] uppercase mb-1">
                  {ticket.eventName}
                </div>
                {ticket.eventDate && (
                  <div className="text-[11px]">{ticket.eventDate}</div>
                )}
                {ticket.venueName && (
                  <div className="text-[11px] mb-2">{ticket.venueName}</div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ticket.dataUrl}
                  alt={`Ticket ${ticket.shortId}`}
                  width={170}
                  height={170}
                  className="mx-auto my-3"
                />
                <div className="font-bold tracking-widest text-[12px]">
                  {ticket.shortId}
                </div>
              </div>
            ))}
            <div className="text-center text-[10px] mb-2">
              {t("ticketsHint")}
            </div>
          </>
        )}

        <div className="text-center mt-3 text-[10px]">{t("thanks")}</div>
      </div>

      <div className="w-[80mm] mt-4 no-print">
        <ReceiptPrintButton />
      </div>

      {/* 80mm thermal / AirPrint sizing */}
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body { background: white; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
