import { getTranslations } from "next-intl/server";
import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default async function AdminPosItemsLoading() {
  const t = await getTranslations("admin.pos.items");
  return (
    <div>
      <AdminPageHeaderSkeleton title={t("title")} subtitle={t("subtitle")} />
      <AdminStatsSkeleton count={3} />
      <AdminTableSkeleton rows={8} />
    </div>
  );
}
