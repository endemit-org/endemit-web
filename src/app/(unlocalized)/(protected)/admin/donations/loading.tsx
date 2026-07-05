import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";
import { getTranslations } from "next-intl/server";

export default async function AdminDonationsLoading() {
  const t = await getTranslations("admin.donations");
  return (
    <div>
      <AdminPageHeaderSkeleton
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <AdminStatsSkeleton count={3} />
      <AdminTableSkeleton rows={10} />
    </div>
  );
}
