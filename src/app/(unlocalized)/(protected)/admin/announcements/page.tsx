import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getAllAnnouncements } from "@/domain/announcement/operations/getAllAnnouncements";
import AnnouncementsDisplay from "@/app/_components/admin/AnnouncementsDisplay";

export const metadata: Metadata = {
  title: "Announcements  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminAnnouncementsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.permissions.includes(PERMISSIONS.ANNOUNCEMENTS_READ)) {
    redirect("/admin");
  }

  const announcements = await getAllAnnouncements();
  const canWrite = currentUser.permissions.includes(
    PERMISSIONS.ANNOUNCEMENTS_WRITE
  );

  const activeCount = announcements.filter((a) => a.status === "active").length;
  const scheduledCount = announcements.filter(
    (a) => a.status === "scheduled"
  ).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-500 mt-1">
          Manage global announcements displayed to users
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {announcements.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Active Now</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {activeCount}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Scheduled</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">
            {scheduledCount}
          </div>
        </div>
      </div>

      <AnnouncementsDisplay initialData={announcements} canWrite={canWrite} />
    </div>
  );
}
