import { getTranslations } from "next-intl/server";
import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default async function AdminUsersLoading() {
  const t = await getTranslations("admin.users");
  return (
    <div>
      <AdminPageHeaderSkeleton
        title={t("page.title")}
        subtitle={t("page.subtitle")}
      />
      <AdminStatsSkeleton count={3} />
      <AdminTableSkeleton rows={10} />
    </div>
  );
}
