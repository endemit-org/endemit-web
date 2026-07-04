import { getTranslations } from "next-intl/server";
import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default async function AdminPosRegistersLoading() {
  const t = await getTranslations("admin.pos.registers");
  return (
    <div>
      <AdminPageHeaderSkeleton title={t("title")} subtitle={t("subtitle")} />
      <AdminStatsSkeleton count={6} />
      <AdminTableSkeleton rows={6} />
    </div>
  );
}
