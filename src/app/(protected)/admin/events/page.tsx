import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { fetchEventsForAdmin } from "@/domain/event/actions/fetchEventsForAdminAction";
import EventsList from "@/app/_components/admin/EventsList";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

export const metadata: Metadata = {
  title: "Events  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminEventsPage() {
  const currentUser = await getCurrentUser();

  // Permission check - must have EVENTS_READ to view this page
  if (!currentUser?.permissions.includes(PERMISSIONS.EVENTS_READ)) {
    redirect("/admin");
  }

  const initialData = await fetchEventsForAdmin();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage event tickets
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Events</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {initialData.totalCount.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Active</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {initialData.activeCount.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Tickets Sold</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {initialData.totalSold.toLocaleString()}
          </div>
        </div>
      </div>

      <EventsList initialData={initialData} />
    </div>
  );
}
