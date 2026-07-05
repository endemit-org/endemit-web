import { getTranslations } from "next-intl/server";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import { BackLinkSkeleton, ProfileTableSkeleton } from "@/app/_components/ui/Skeletons";

export default async function TicketsLoading() {
  const t = await getTranslations("profile");
  return (
    <OuterPage>
      <PageHeadline
        title={t("breadcrumb.tickets")}
        segments={[
          { label: "Endemit", path: "" },
          { label: t("breadcrumb.myProfile"), path: "profile" },
          { label: t("breadcrumb.tickets"), path: "tickets" },
        ]}
      />

      <InnerPage>
        <BackLinkSkeleton />
        <ProfileTableSkeleton title={t("tickets.upcomingTitle")} rows={5} />
      </InnerPage>
    </OuterPage>
  );
}
