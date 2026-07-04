import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import ProfileEditForm from "@/app/_components/profile/ProfileEditForm";
import { getUserSticker } from "@/domain/sticker/operations/getUserSticker";
import { signReceiveCode } from "@/domain/wallet/util/receiveCode";
import ReceiveFundsCard from "@/app/_components/profile/ReceiveFundsCard";

// Dynamic import: QR Scanner (~120KB) only loads when component mounts
const BackupStickerCard = dynamic(
  () => import("@/app/_components/profile/BackupStickerCard")
);

export const metadata: Metadata = {
  title: "Edit Profile",
  description: "Edit your profile information",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProfileEditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "sl" | "en");
  const t = await getTranslations("profile");
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const sticker = await getUserSticker(user.id);
  const receiveCode = signReceiveCode(user.id);

  return (
    <OuterPage>
      <PageHeadline
        title={t("nav.editProfile")}
        segments={[
          { label: "Endemit", path: "" },
          { label: t("breadcrumb.myProfile"), path: "profile" },
          { label: t("breadcrumb.edit"), path: "edit" },
        ]}
      />

      <InnerPage>
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/profile"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t("nav.backToProfile")}
            </Link>
          </div>

          <div className="bg-neutral-900 rounded-lg p-6">
            <ProfileEditForm name={user.name} image={user.image} />
          </div>

          <ReceiveFundsCard receiveCode={receiveCode} />

          <BackupStickerCard
            currentCode={sticker?.code ?? null}
            claimedAt={sticker?.claimedAt?.toISOString() ?? null}
          />
        </div>
      </InnerPage>
    </OuterPage>
  );
}
