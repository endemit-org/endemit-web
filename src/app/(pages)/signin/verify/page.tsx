import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, createUserSession } from "@/lib/services/auth";
import { verifyMagicLinkAction } from "@/domain/auth/actions/verifyMagicLinkAction";
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
  searchParams: Promise<{ email?: string; token?: string }>;
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  // Redirect if already logged in
  if (user) {
    redirect("/");
  }

  const params = await searchParams;

  // Handle magic link verification
  if (params.token) {
    const result = await verifyMagicLinkAction(params.token);

    if (result.success && result.userId) {
      await createUserSession(result.userId);
      redirect("/");
    }

    // If magic link verification failed, show the manual code entry form
    return (
      <OtcVerifyForm
        email={params.email || ""}
        error={result.error || "Invalid or expired link. Please enter your code manually."}
      />
    );
  }

  // Show the code entry form
  if (!params.email) {
    redirect("/signin");
  }

  return <OtcVerifyForm email={params.email} />;
}
