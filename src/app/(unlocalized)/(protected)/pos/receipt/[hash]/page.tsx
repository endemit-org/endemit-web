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
          <div className="font-bold text-[14px] uppercase">Endemit</div>
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
            <div className="break-all">
              <span>ZOI: {fiscalInvoice.zoi}</span>
            </div>
            <div className="break-all">
              <span>
                EOR: {fiscalInvoice.eor ?? t("eorPending")}
              </span>
            </div>
            {fiscalQrDataUrl && (
              <div className="flex justify-center mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fiscalQrDataUrl}
                  alt="FURS QR"
                  width={130}
                  height={130}
                />
              </div>
            )}
          </>
        )}

        {!fiscalInvoice && (
          <>
            <div className="border-t border-dashed border-black my-2" />
            <div className="text-center text-[10px]">{t("disclaimer")}</div>
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
