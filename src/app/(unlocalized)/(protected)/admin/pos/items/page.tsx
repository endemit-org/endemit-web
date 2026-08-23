import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getAllPosItems } from "@/domain/pos/operations/getAllPosItems";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import PosItemsDisplay from "@/app/_components/admin/PosItemsDisplay";

export const metadata: Metadata = {
  title: "POS Items  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPosItemsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.permissions.includes(PERMISSIONS.POS_ITEMS_READ)) {
    redirect("/admin");
  }

  const t = await getTranslations("admin.pos.items");

  const [{ items }, cmsEvents] = await Promise.all([
    getAllPosItems(),
    fetchEventsFromCms({}).catch(() => null),
  ]);
  const canWrite = currentUser.permissions.includes(PERMISSIONS.POS_ITEMS_WRITE);

  // Upcoming events first, then most recent past — for the ticket-item picker
  const now = Date.now();
  const eventOptions = (cmsEvents ?? [])
    .filter(event => event.date_start)
    .sort((a, b) => {
      const aTime = a.date_start!.getTime();
      const bTime = b.date_start!.getTime();
      const aUpcoming = aTime >= now;
      const bUpcoming = bTime >= now;
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      return aUpcoming ? aTime - bTime : bTime - aTime;
    })
    .map(event => ({ id: event.id, name: event.name }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">
            {t("stats.total")}
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {items.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">
            {t("stats.active")}
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {items.filter(i => i.status === "ACTIVE").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">
            {t("stats.inactive")}
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {items.filter(i => i.status === "INACTIVE").length}
          </div>
        </div>
      </div>

      <PosItemsDisplay
        initialItems={items}
        canWrite={canWrite}
        eventOptions={eventOptions}
      />
    </div>
  );
}
