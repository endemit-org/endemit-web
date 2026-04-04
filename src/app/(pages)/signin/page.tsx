import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import OtcEmailForm from "@/app/_components/auth/OtcEmailForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SignInPage() {
  const user = await getCurrentUser();

  // Redirect if already logged in
  if (user) {
    redirect("/");
  }

  return <OtcEmailForm />;
}
