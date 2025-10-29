import { Metadata } from "next";
import SignInForm from "@/app/_components/auth/SingIn";

export const metadata: Metadata = {
  title: "Sign in required",
  description: "Sing in and authentication are required to access this page.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignInPage() {
  return <SignInForm />;
}
