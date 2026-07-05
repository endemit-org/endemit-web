import { getTranslations } from "next-intl/server";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import { BackLinkSkeleton, OrderDetailSkeleton } from "@/app/_components/ui/Skeletons";

export default async function OrderDetailLoading() {
  const t = await getTranslations("profile");
  return (
    <OuterPage>
      <PageHeadline
        title={t("orders.detailTitle")}
        segments={[
          { label: "Endemit", path: "" },
          { label: t("breadcrumb.myProfile"), path: "profile" },
          { label: t("breadcrumb.orders"), path: "orders" },
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
