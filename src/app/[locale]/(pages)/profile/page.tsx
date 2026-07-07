import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/services/auth";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import {
  ProfileSidebarSkeleton,
  ProfileTableSkeleton,
  EventsPromoSkeleton,
  ProfileEventsAttendedSkeleton,
} from "@/app/_components/ui/Skeletons";
import ProfileSidebarAsync from "@/app/_components/profile/async/ProfileSidebarAsync";
import ProfileTransactionsAsync from "@/app/_components/profile/async/ProfileTransactionsAsync";
import ProfileTicketsAsync from "@/app/_components/profile/async/ProfileTicketsAsync";
import ProfileOrdersAsync from "@/app/_components/profile/async/ProfileOrdersAsync";
import ProfileEventsAttendedAsync from "@/app/_components/profile/async/ProfileEventsAttendedAsync";
import ProfileUpcomingEventsAsync from "@/app/_components/profile/async/ProfileUpcomingEventsAsync";
import ProfileAnnouncementsAsync from "@/app/_components/profile/async/ProfileAnnouncementsAsync";
import ProfileAccessButtonsAsync from "@/app/_components/profile/async/ProfileAccessButtonsAsync";
import StickerLinkPrompt from "@/app/_components/profile/StickerLinkPrompt";
import WristbandIntro from "@/app/_components/profile/WristbandIntro";
import { getStickerProperty } from "@/domain/sticker/operations/getStickerProperty";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "sl" | "en", namespace: "profile" });
  return {
    title: t("meta.profile.title"),
    description: t("meta.profile.description"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ paymentCode?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "sl" | "en");
  const t = await getTranslations("profile");
  const user = await getCurrentUser();
  const { paymentCode } = await searchParams;

  if (!user) {
    // Someone scanned a wristband QR without being signed in: show them what
    // the flow looks like before sending them into sign-in.
    if (paymentCode) {
      return <WristbandIntro color={await getStickerProperty(paymentCode)} />;
    }
    redirect(`/signin?callbackUrl=${encodeURIComponent("/profile")}`);
  }

  return (
    <OuterPage>
      <PageHeadline
        title={t("breadcrumb.myProfile")}
        segments={[
          { label: "Endemit", path: "" },
          { label: t("breadcrumb.myProfile"), path: "profile" },
        ]}
      />

      <InnerPage className="overflow-visible max-sm:p-0 max-sm:bg-transparent">
        {/* Announcements banner - always mounted for realtime subscription */}
        <Suspense fallback={null}>
          <ProfileAnnouncementsAsync userId={user.id} />
        </Suspense>

        <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
          {/* Sidebar - streams in with wallet/tickets data */}
          <div className="lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-24 lg:self-start">
            <Suspense fallback={<ProfileSidebarSkeleton />}>
              <ProfileSidebarAsync
                userId={user.id}
                name={user.name}
                email={user.email!}
                image={user.image}
              />
            </Suspense>
          </div>

          {/* Main content - streams progressively */}
          <div className="flex-1 space-y-6 max-sm:space-y-12">
            {paymentCode && <StickerLinkPrompt paymentCode={paymentCode} />}

            {/* Access buttons for staff (admin, POS, scanner) */}
            <Suspense fallback={null}>
              <ProfileAccessButtonsAsync userId={user.id} />
            </Suspense>

            <Suspense fallback={<EventsPromoSkeleton />}>
              <ProfileUpcomingEventsAsync userId={user.id} />
            </Suspense>

            <Suspense fallback={<ProfileTableSkeleton title={t("cashlessTransactions")} />}>
              <ProfileTransactionsAsync userId={user.id} />
            </Suspense>

            <Suspense fallback={<ProfileTableSkeleton title={t("tickets.upcomingTitle")} />}>
              <ProfileTicketsAsync userId={user.id} />
            </Suspense>

            <Suspense fallback={<ProfileTableSkeleton title={t("breadcrumb.orders")} />}>
              <ProfileOrdersAsync userId={user.id} />
            </Suspense>

            <Suspense fallback={<ProfileEventsAttendedSkeleton />}>
              <ProfileEventsAttendedAsync userId={user.id} />
            </Suspense>
          </div>
        </div>
      </InnerPage>
    </OuterPage>
  );
}
