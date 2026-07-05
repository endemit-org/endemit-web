import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/services/auth";
import OtcVerifyForm from "@/app/_components/auth/OtcVerifyForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "sl" | "en", namespace: "signin" });
  return {
    title: t("verify.metaTitle"),
    description: t("verify.metaDescription"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

interface PageProps {
  searchParams: Promise<{ email?: string; error?: string; callbackUrl?: string }>;
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  // Redirect if already logged in
  if (user) {
    redirect("/profile");
  }

  const params = await searchParams;

  // Show the code entry form
  if (!params.email) {
    redirect("/signin");
  }

  return (
    <OtcVerifyForm
      email={params.email}
      error={params.error}
      callbackUrl={params.callbackUrl}
    />
  );
}
