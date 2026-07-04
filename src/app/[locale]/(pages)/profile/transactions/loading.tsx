import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import { BackLinkSkeleton, ProfileTableSkeleton } from "@/app/_components/ui/Skeletons";

export default function TransactionsLoading() {
  return (
    <OuterPage>
      <PageHeadline
        title="Transactions"
        segments={[
          { label: "Endemit", path: "" },
          { label: "My Profile", path: "profile" },
          { label: "Transactions", path: "transactions" },
        ]}
      />

      <InnerPage>
        <BackLinkSkeleton />
        <ProfileTableSkeleton title="Transaction History" rows={5} />
      </InnerPage>
    </OuterPage>
  );
}
