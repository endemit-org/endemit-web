import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  listAllEventClaims,
  type EventClaimListFilter,
} from "@/domain/claim/operations/listAllEventClaims";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { isEventVisible } from "@/domain/event/businessLogic";
import EventClaimsDisplay from "@/app/_components/admin/EventClaimsDisplay";

export const metadata: Metadata = {
  title: "Event Claims  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  searchParams: Promise<{
    filter?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AdminEventClaimsPage({ searchParams }: PageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.permissions.includes(PERMISSIONS.EVENT_CLAIMS_MANAGE)) {
    redirect("/admin");
  }

  const resolvedSearch = await searchParams;
  const rawFilter = resolvedSearch.filter ?? "all";
  const filter: EventClaimListFilter =
    rawFilter === "PENDING" || rawFilter === "APPROVED" ? rawFilter : "all";
  const search = resolvedSearch.search?.trim() ?? "";
  const page = Math.max(1, Number(resolvedSearch.page ?? "1") || 1);

  const [claimsResult, allEvents] = await Promise.all([
    listAllEventClaims({
      filter,
      search: search || undefined,
      page,
      pageSize: 50,
    }),
    fetchEventsFromCms({}),
  ]);

  const now = new Date();
  const pastEvents = (allEvents ?? [])
    .filter(event => isEventVisible(event))
    .filter(event => {
      const eventEnd = event.date_end ?? event.date_start;
      return !!eventEnd && new Date(eventEnd) < now;
    })
    .map(event => ({
      id: event.id,
      name: event.name,
      dateStart: event.date_start?.toISOString() ?? null,
    }))
    .sort((a, b) => {
      if (!a.dateStart) return 1;
      if (!b.dateStart) return -1;
      return new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime();
    });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Event Claims</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review user claims for past events. Claims auto-approve 5 minutes
          after submission — this page lets you approve earlier, delete
          unwanted ones, or add a claim on behalf of a user.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {claimsResult.pendingCount + claimsResult.approvedCount}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Pending</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {claimsResult.pendingCount}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Approved</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {claimsResult.approvedCount}
          </div>
        </div>
      </div>

      <EventClaimsDisplay
        initial={{
          items: claimsResult.items.map(c => ({
            id: c.id,
            eventId: c.eventId,
            eventName: c.eventName,
            status: c.status,
            createdAt: c.createdAt.toISOString(),
            approvedAt: c.approvedAt?.toISOString() ?? null,
            user: c.user,
          })),
          total: claimsResult.total,
          page: claimsResult.page,
          pageSize: claimsResult.pageSize,
          filter,
          search,
        }}
        pastEvents={pastEvents}
      />
    </div>
  );
}
