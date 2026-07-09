import ProtectedEnvironmentLogin from "@/app/_components/development/ProtectedEnvironmentLogin";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("stagingLogin");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function StagingLoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center ">
      <ProtectedEnvironmentLogin />
    </div>
  );
}
