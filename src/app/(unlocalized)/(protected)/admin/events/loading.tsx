import { getTranslations } from "next-intl/server";
import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default async function AdminEventsLoading() {
  const t = await getTranslations("admin.events");

  return (
    <div>
      <AdminPageHeaderSkeleton
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <AdminStatsSkeleton count={3} />
      <AdminTableSkeleton rows={8} />
    </div>
  );
}
