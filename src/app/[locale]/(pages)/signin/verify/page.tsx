import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import OtcVerifyForm from "@/app/_components/auth/OtcVerifyForm";

export const metadata: Metadata = {
  title: "Verify Code",
  description: "Enter your verification code",
  robots: {
    index: false,
    follow: false,
  },
};

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
