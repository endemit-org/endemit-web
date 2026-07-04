import { getTranslations } from "next-intl/server";
import {
  AdminBackLinkSkeleton,
  AdminFormSkeleton,
} from "@/app/_components/ui/Skeletons";

export default async function AdminNewRoleLoading() {
  const t = await getTranslations("admin.roles");
  return (
    <div>
      <AdminBackLinkSkeleton />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("new.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("new.subtitle")}</p>
      </div>
      <AdminFormSkeleton />
    </div>
  );
}
