import type { Metadata } from "next";
import { fetchEventsForAdmin } from "@/domain/event/actions/fetchEventsForAdminAction";
import EventsList from "@/app/_components/admin/EventsList";

export const metadata: Metadata = {
  title: "Events  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminEventsPage() {
  const initialData = await fetchEventsForAdmin();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage event tickets
        </p>
      </div>
      <EventsList initialData={initialData} />
    </div>
  );
}
