import type { Metadata } from "next";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import OuterPage from "@/app/_components/ui/OuterPage";
import InnerPage from "@/app/_components/ui/InnerPage";
import ActionButton from "@/app/_components/form/ActionButton";
import { stripe } from "@/lib/services/stripe";
import { formatDecimalPrice } from "@/lib/util/formatting";
import { Link } from "@/i18n/navigation";
import AnimatedWarningIcon from "@/app/_components/icon/AnimatedWarningIcon";
import { transformPriceFromStripe } from "@/domain/checkout/transformers/transformPriceFromStripe";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; sessionId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "sl" | "en", namespace: "store" });
  return {
    title: t("interrupted.metaTitle"),
    description: t("interrupted.metaDescription"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function InterruptedPage({
  params,
}: {
  params: Promise<{
    locale: string;
    sessionId: string;
  }>;
}) {
  const { locale, sessionId } = await params;
  setRequestLocale(locale as "sl" | "en");
  const t = await getTranslations("store");

  if (!sessionId) {
    notFound();
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const totalAmount = formatDecimalPrice(
    transformPriceFromStripe(Number(session.amount_total))
  );

  if (session.status !== "open") {
    notFound();
  }

  return (
    <OuterPage>
      <PageHeadline
        title={t("interrupted.title")}
        segments={[
          { label: "Endemit", path: "" },
          { label: t("breadcrumb.store"), path: "store" },
          {
            label: t("interrupted.breadcrumb"),
            path: `checkout/interrupted/${sessionId}`,
          },
        ]}
      />

      <InnerPage>
        <div className="flex items-center justify-center">
          <div className="max-w-md w-full text-center py-8">
            {/* Info Icon */}
            <div className="mb-8 flex justify-center">
              <AnimatedWarningIcon />
            </div>

            {/* Message */}
            <h1 className="text-3xl font-bold text-neutral-200 mb-4">
              {t("interrupted.heading")}
            </h1>

            <p className="text-gray-400 mb-8">{t("interrupted.body")}</p>

            {/* Amount Box */}
            <div className="bg-zinc-900 rounded-lg p-4 mb-8">
              <p className="text-gray-500 text-sm mb-1">
                {t("interrupted.orderTotal")}
              </p>
              <p className="text-neutral-200 text-2xl">{totalAmount}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <ActionButton href={session.url ?? ""} variant="primary">
                {t("interrupted.completePayment")}
              </ActionButton>

              <ActionButton href="/store/checkout" variant="secondary">
                {t("interrupted.returnToCart")}
              </ActionButton>
            </div>

            <p className="text-gray-500 text-sm mt-6">
              {t.rich("interrupted.needHelp", {
                contact: (chunks: ReactNode) => (
                  <Link href="mailto:endemit@endemit.org" className="link">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </div>
      </InnerPage>
    </OuterPage>
  );
}
