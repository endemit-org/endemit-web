import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getAllShortLinks } from "@/domain/shortLink/operations/getAllShortLinks";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import ShortLinksDisplay from "@/app/_components/admin/ShortLinksDisplay";

export const metadata: Metadata = {
  title: "Short Links  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminShortLinksPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.permissions.includes(PERMISSIONS.SHORT_LINKS_READ)) {
    redirect("/admin");
  }

  const t = await getTranslations("admin.shortLinks");
  const links = await getAllShortLinks();

  const canWrite = currentUser.permissions.includes(
    PERMISSIONS.SHORT_LINKS_WRITE
  );
  const totalClicks = links.reduce((sum, link) => sum + link.clickCount, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-gray-500">{t("statLinks")}</p>
          <p className="text-xl font-semibold text-gray-900">{links.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-gray-500">{t("statClicks")}</p>
          <p className="text-xl font-semibold text-gray-900">{totalClicks}</p>
        </div>
      </div>

      {/* The base URL comes from the environment, so a link copied on staging
          points at staging and one copied on production points at production. */}
      <ShortLinksDisplay
        links={links}
        canWrite={canWrite}
        baseUrl={PUBLIC_BASE_WEB_URL}
      />
    </div>
  );
}
