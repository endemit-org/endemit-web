import ProtectedEnvironmentLogin from "@/app/_components/development/ProtectedEnvironmentLogin";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "🔑 Passcode required",
  description:
    "This environment is protected and requires a passcode to access this page.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StagingLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center ">
      <ProtectedEnvironmentLogin />
    </div>
  );
}
