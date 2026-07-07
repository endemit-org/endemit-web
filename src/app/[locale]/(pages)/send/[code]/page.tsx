import type { Metadata } from "next";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/services/auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// Landing page for shared wallet receive links (/send/ndr1.<userId>.<sig>).
// Signs the visitor in if needed, then drops them into the transfer flow
// with the recipient pre-filled.
export default async function SendLinkPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  const decoded = decodeURIComponent(code);
  const user = await getCurrentUser();

  if (!user) {
    redirect({
      href: `/signin?callbackUrl=${encodeURIComponent(`/send/${code}`)}`,
      locale: locale as "sl" | "en",
    });
  }

  redirect({
    href: `/profile/transactions?send=${encodeURIComponent(decoded)}`,
    locale: locale as "sl" | "en",
  });
}
