import { getTranslations } from "next-intl/server";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import { BackLinkSkeleton, TransactionDetailSkeleton } from "@/app/_components/ui/Skeletons";

export default async function TransactionDetailLoading() {
  const t = await getTranslations("profile");
  return (
    <OuterPage>
      <PageHeadline
        title={t("transactions.detailTitle")}
        segments={[
          { label: "Endemit", path: "" },
          { label: t("breadcrumb.myProfile"), path: "profile" },
          { label: t("breadcrumb.transactions"), path: "transactions" },
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
