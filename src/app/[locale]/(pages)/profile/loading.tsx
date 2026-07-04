import { getTranslations } from "next-intl/server";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import {
  ProfileSidebarSkeleton,
  ProfileTableSkeleton,
  EventsPromoSkeleton,
  ProfileEventsAttendedSkeleton,
} from "@/app/_components/ui/Skeletons";

export default async function ProfileLoading() {
  const t = await getTranslations("profile");
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
        <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
          {/* Sidebar */}
          <div className="lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-24 lg:self-start">
            <ProfileSidebarSkeleton />
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-6 max-sm:space-y-12">
            <EventsPromoSkeleton />
            <ProfileTableSkeleton title={t("cashlessTransactions")} />
            <ProfileTableSkeleton title={t("tickets.upcomingTitle")} />
            <ProfileTableSkeleton title={t("breadcrumb.orders")} />
            <ProfileEventsAttendedSkeleton />
          </div>
        </div>
      </InnerPage>
    </OuterPage>
  );
}
