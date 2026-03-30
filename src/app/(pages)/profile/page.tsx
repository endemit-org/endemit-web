import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import { getOrdersByUserId } from "@/domain/order/operations/getOrdersByUserId";
import { getTicketsByUserId } from "@/domain/ticket/operations/getTicketsByUserId";
import { getVisibleProducts } from "@/domain/product/actions/getProducts";
import { ProductCategory } from "@/domain/product/types/product";
import { prismicClient } from "@/lib/services/prismic";
import type { EventDocument } from "@/prismicio-types";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import ProfileSidebar from "@/app/_components/profile/ProfileSidebar";
import ProfileOrdersPreview from "@/app/_components/profile/ProfileOrdersPreview";
import ProfileTransactionsPreview from "@/app/_components/profile/ProfileTransactionsPreview";
import ProfileTicketsPreview from "@/app/_components/profile/ProfileTicketsPreview";
import ProfileEventsAttended from "@/app/_components/profile/ProfileEventsAttended";
import { getBlurDataURL } from "@/lib/util/util";

export const metadata: Metadata = {
  title: "Profile",
  description: "View and manage your Endemit account",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  // Fetch all data in parallel
  const [wallet, orders, upcomingTickets, pastTickets, allProducts] =
    await Promise.all([
      getWalletByUserId(user.id),
      getOrdersByUserId(user.id),
      getTicketsByUserId(user.id, { upcomingOnly: true }),
      getTicketsByUserId(user.id, { pastOnly: true }),
      getVisibleProducts(),
    ]);

  // Filter to currency products for top-up
  const currencyProducts = allProducts.filter(
    p => p.category === ProductCategory.CURRENCIES
  );

  const recentOrders = orders.slice(0, 5);
  const recentTransactions = wallet?.transactions.slice(0, 5) ?? [];
  const recentTickets = upcomingTickets.slice(0, 5);

  // Fetch event data for past events attended
  const pastEventIds = [...new Set(pastTickets.map(t => t.eventId))];
  let pastEvents: Array<{
    id: string;
    uid: string;
    name: string;
    dateStart: Date | null;
    dateEnd: Date | null;
    image: { src: string; alt: string | null; placeholder: string } | null;
    link: string;
  }> = [];

  if (pastEventIds.length > 0) {
    const eventsFromCms = await prismicClient
      .getByIDs<EventDocument>(pastEventIds)
      .catch(() => ({ results: [] }));

    pastEvents = await Promise.all(
      eventsFromCms.results.map(async event => ({
        id: event.id,
        uid: event.uid ?? "",
        name: event.data.title ?? "Event",
        dateStart: event.data.date_start
          ? new Date(event.data.date_start)
          : null,
        dateEnd: event.data.date_end ? new Date(event.data.date_end) : null,
        image: event.data.promo_image?.url
          ? {
              src: event.data.promo_image.url,
              alt: event.data.promo_image.alt,
              placeholder: await getBlurDataURL(event.data.promo_image.url),
            }
          : null,
        link: event.data.enable_link_to_full_page ? `/events/${event.uid}` : "",
      }))
    );
  }

  return (
    <OuterPage>
      <PageHeadline
        title="Profile"
        segments={[
          { label: "Endemit", path: "" },
          { label: "Profile", path: "profile" },
        ]}
      />

      <InnerPage className="overflow-visible max-sm:p-0 max-sm:bg-transparent">
        <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
          {/* Sidebar - fixed width on desktop, full width on mobile */}
          <div className="lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-24 lg:self-start">
            <ProfileSidebar
              name={user.name}
              email={user.email!}
              image={user.image}
              walletBalance={wallet?.balance ?? null}
              currencyProducts={currencyProducts}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-6 max-sm:space-y-12">
            <ProfileTransactionsPreview
              userId={user.id}
              initialTransactions={recentTransactions}
              totalCount={wallet?.transactions.length ?? 0}
            />

            <ProfileTicketsPreview
              tickets={recentTickets}
              totalCount={upcomingTickets.length}
            />

            <ProfileOrdersPreview
              orders={recentOrders}
              totalCount={orders.length}
            />

            <ProfileEventsAttended events={pastEvents} />
          </div>
        </div>
      </InnerPage>
    </OuterPage>
  );
}
