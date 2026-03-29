import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/services/auth";
import { getTicketsByUserId } from "@/domain/ticket/operations/getTicketsByUserId";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import MyTicketsDisplay from "@/app/_components/profile/MyTicketsDisplay";

export const metadata: Metadata = {
  title: "Tickets",
  description: "View your event tickets",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProfileTicketsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const tickets = await getTicketsByUserId(user.id);

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
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
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
            <span className="text-sm text-neutral-500">
              {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
            </span>
          </div>

          <MyTicketsDisplay tickets={tickets} />
        </div>
      </InnerPage>
    </OuterPage>
  );
}
