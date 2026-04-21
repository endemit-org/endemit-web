import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/services/auth";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import ProfileEditForm from "@/app/_components/profile/ProfileEditForm";
import BackupStickerCard from "@/app/_components/profile/BackupStickerCard";
import { getUserSticker } from "@/domain/sticker/operations/getUserSticker";

export const metadata: Metadata = {
  title: "Edit Profile",
  description: "Edit your profile information",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProfileEditPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const sticker = await getUserSticker(user.id);

  return (
    <OuterPage>
      <PageHeadline
        title="Edit Profile"
        segments={[
          { label: "Endemit", path: "" },
          { label: "My Profile", path: "profile" },
          { label: "Edit", path: "edit" },
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
              Back to Profile
            </Link>
          </div>

          <div className="bg-neutral-900 rounded-lg p-6">
            <ProfileEditForm name={user.name} image={user.image} />
          </div>

          <BackupStickerCard
            currentCode={sticker?.code ?? null}
            claimedAt={sticker?.claimedAt?.toISOString() ?? null}
          />
        </div>
      </InnerPage>
    </OuterPage>
  );
}
