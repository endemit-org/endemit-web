import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import { BackLinkSkeleton, ProfileTableSkeleton } from "@/app/_components/ui/Skeletons";

export default function OrdersLoading() {
  return (
    <OuterPage>
      <PageHeadline
        title="Orders"
        segments={[
          { label: "Endemit", path: "" },
          { label: "My Profile", path: "profile" },
          { label: "Orders", path: "orders" },
        ]}
      />

      <InnerPage>
        <BackLinkSkeleton />
        <ProfileTableSkeleton title="Order History" rows={5} />
      </InnerPage>
    </OuterPage>
  );
}
