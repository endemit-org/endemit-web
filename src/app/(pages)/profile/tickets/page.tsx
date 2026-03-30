import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/services/auth";
import { getTicketsByUserId } from "@/domain/ticket/operations/getTicketsByUserId";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import TicketOutlineIcon from "@/app/_components/icon/TicketOutlineIcon";
import ProfileTable, {
  ProfileTableRow,
} from "@/app/_components/profile/ProfileTable";

export const metadata: Metadata = {
  title: "Tickets",
  description: "View your event tickets",
  robots: {
    index: false,
    follow: false,
  },
};

const statusColors: Record<string, string> = {
  VALIDATED: "bg-green-500/20 text-green-400",
  PENDING: "bg-yellow-500/20 text-yellow-400",
  SCANNED: "bg-blue-500/20 text-blue-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  BANNED: "bg-red-500/20 text-red-400",
};

export default async function ProfileTicketsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const tickets = await getTicketsByUserId(user.id, { upcomingOnly: true });

  return (
    <OuterPage>
      <PageHeadline
        title="Tickets"
        segments={[
          { label: "Endemit", path: "" },
          { label: "Profile", path: "profile" },
          { label: "Tickets", path: "profile/tickets" },
        ]}
      />

      <InnerPage>
        <div className="mb-6">
          <Link
            href="/profile"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Profile
          </Link>
        </div>

        <ProfileTable
          title="Upcoming Tickets"
          count={tickets.length}
          countLabel={tickets.length === 1 ? "ticket" : "tickets"}
          isEmpty={tickets.length === 0}
          emptyIcon={<TicketOutlineIcon className="w-6 h-6 text-neutral-500" />}
          emptyMessage="No upcoming tickets"
          emptyAction={{ label: "Browse events", href: "/events" }}
        >
          {tickets.map((ticket, index) => {
            const isUsable =
              ticket.status === "VALIDATED" || ticket.status === "PENDING";

            return (
              <ProfileTableRow
                key={ticket.id}
                href={`/profile/tickets/${ticket.shortId}`}
                index={index}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <TicketOutlineIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-neutral-200 font-medium truncate">
                        {ticket.eventName} – {ticket.ticketHolderName}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[ticket.status] || "bg-gray-500/20 text-gray-400"}`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 font-mono">
                      {ticket.shortId}
                    </div>
                  </div>
                </div>
                {isUsable && (
                  <div className="ml-4 text-sm text-blue-400 flex-shrink-0">
                    View
                  </div>
                )}
              </ProfileTableRow>
            );
          })}
        </ProfileTable>
      </InnerPage>
    </OuterPage>
  );
}
