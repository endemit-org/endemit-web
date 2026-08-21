import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getTranslationCatalog } from "@/domain/translation/operations/getTranslationCatalog";
import TranslationsDisplay from "@/app/_components/admin/translations/TranslationsDisplay";

export const metadata: Metadata = {
  title: "Translations  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminTranslationsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.permissions.includes(PERMISSIONS.TRANSLATIONS_MANAGE)) {
    redirect("/admin");
  }

  const t = await getTranslations("admin.translations");
  const catalog = await getTranslationCatalog();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <TranslationsDisplay initialCatalog={catalog} />
    </div>
  );
}
