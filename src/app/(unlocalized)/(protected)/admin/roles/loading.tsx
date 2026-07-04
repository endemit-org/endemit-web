import { getTranslations } from "next-intl/server";
import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default async function AdminRolesLoading() {
  const t = await getTranslations("admin.roles");
  return (
    <div>
      <AdminPageHeaderSkeleton
        title={t("page.title")}
        subtitle={t("page.subtitle")}
      />
      <AdminStatsSkeleton count={3} />
      <AdminTableSkeleton rows={8} />
    </div>
  );
}
