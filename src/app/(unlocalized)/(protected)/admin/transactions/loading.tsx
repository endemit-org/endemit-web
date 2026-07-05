import { getTranslations } from "next-intl/server";
import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default async function AdminTransactionsLoading() {
  const t = await getTranslations("admin.transactions");
  return (
    <div>
      <AdminPageHeaderSkeleton title={t("title")} subtitle={t("subtitle")} />
      <AdminStatsSkeleton count={3} />
      <AdminTableSkeleton rows={10} />
    </div>
  );
}
