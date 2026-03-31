import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
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

export const metadata: Metadata = {
  title: "Profile",
  description: "View and manage your Endemit account",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <OuterPage>
      <PageHeadline
        title="My Profile"
        segments={[
          { label: "Endemit", path: "" },
          { label: "My Profile", path: "profile" },
        ]}
      />

      <InnerPage className="overflow-visible max-sm:p-0 max-sm:bg-transparent">
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
            <Suspense fallback={<EventsPromoSkeleton />}>
              <ProfileUpcomingEventsAsync userId={user.id} />
            </Suspense>

            <Suspense fallback={<ProfileTableSkeleton title="Cashless Transactions" />}>
              <ProfileTransactionsAsync userId={user.id} />
            </Suspense>

            <Suspense fallback={<ProfileTableSkeleton title="Upcoming Tickets" />}>
              <ProfileTicketsAsync userId={user.id} />
            </Suspense>

            <Suspense fallback={<ProfileTableSkeleton title="Orders" />}>
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
