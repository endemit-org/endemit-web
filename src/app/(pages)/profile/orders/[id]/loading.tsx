import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import { BackLinkSkeleton, OrderDetailSkeleton } from "@/app/_components/ui/Skeletons";

export default function OrderDetailLoading() {
  return (
    <OuterPage>
      <PageHeadline
        title="Order Details"
        segments={[
          { label: "Endemit", path: "" },
          { label: "My Profile", path: "profile" },
          { label: "Orders", path: "orders" },
          { label: "...", path: "" },
        ]}
      />

      <InnerPage>
        <BackLinkSkeleton />
        <OrderDetailSkeleton />
      </InnerPage>
    </OuterPage>
  );
}
