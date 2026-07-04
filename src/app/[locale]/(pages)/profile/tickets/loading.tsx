import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import { BackLinkSkeleton, ProfileTableSkeleton } from "@/app/_components/ui/Skeletons";

export default function TicketsLoading() {
  return (
    <OuterPage>
      <PageHeadline
        title="Tickets"
        segments={[
          { label: "Endemit", path: "" },
          { label: "My Profile", path: "profile" },
          { label: "Tickets", path: "tickets" },
        ]}
      />

      <InnerPage>
        <BackLinkSkeleton />
        <ProfileTableSkeleton title="Upcoming Tickets" rows={5} />
      </InnerPage>
    </OuterPage>
  );
}
