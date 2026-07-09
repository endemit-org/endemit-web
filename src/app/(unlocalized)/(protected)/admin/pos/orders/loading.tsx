import { getTranslations } from "next-intl/server";
import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default async function AdminPosOrdersLoading() {
  const t = await getTranslations("admin.pos.orders");
  return (
    <div>
      <AdminPageHeaderSkeleton title={t("title")} subtitle={t("subtitle")} />
      <AdminStatsSkeleton count={5} />
      <AdminTableSkeleton rows={10} />
    </div>
  );
}
