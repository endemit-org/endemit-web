import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import { BackLinkSkeleton, TicketDetailSkeleton } from "@/app/_components/ui/Skeletons";

export default function TicketDetailLoading() {
  return (
    <OuterPage>
      <PageHeadline
        title="Ticket"
        segments={[
          { label: "Endemit", path: "" },
          { label: "My Profile", path: "profile" },
          { label: "Tickets", path: "tickets" },
          { label: "...", path: "" },
        ]}
      />

      <InnerPage>
        <BackLinkSkeleton />
        <TicketDetailSkeleton />
      </InnerPage>
    </OuterPage>
  );
}
