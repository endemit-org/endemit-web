import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import { BackLinkSkeleton, TransactionDetailSkeleton } from "@/app/_components/ui/Skeletons";

export default function TransactionDetailLoading() {
  return (
    <OuterPage>
      <PageHeadline
        title="Transaction Details"
        segments={[
          { label: "Endemit", path: "" },
          { label: "My Profile", path: "profile" },
          { label: "Transactions", path: "transactions" },
          { label: "...", path: "" },
        ]}
      />

      <InnerPage>
        <BackLinkSkeleton />
        <TransactionDetailSkeleton />
      </InnerPage>
    </OuterPage>
  );
}
