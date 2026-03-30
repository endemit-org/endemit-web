import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/services/auth";
import { getOrdersByUserId } from "@/domain/order/operations/getOrdersByUserId";
import { formatCurrency } from "@/lib/util/formatting";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import ShoppingBagIcon from "@/app/_components/icon/ShoppingBagIcon";
import ProfileTable, {
  ProfileTableRow,
} from "@/app/_components/profile/ProfileTable";

export const metadata: Metadata = {
  title: "Orders",
  description: "View your order history",
  robots: {
    index: false,
    follow: false,
  },
};

const statusColors: Record<string, string> = {
  PAID: "bg-green-500/20 text-green-400",
  CREATED: "bg-yellow-500/20 text-yellow-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  REFUNDED: "bg-gray-500/20 text-gray-400",
  EXPIRED: "bg-gray-500/20 text-gray-400",
  SHIPPED: "bg-blue-500/20 text-blue-400",
  DELIVERED: "bg-green-500/20 text-green-400",
};

export default async function ProfileOrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const orders = await getOrdersByUserId(user.id);

  return (
    <OuterPage>
      <PageHeadline
        title="Orders"
        segments={[
          { label: "Endemit", path: "" },
          { label: "Profile", path: "profile" },
          { label: "Orders", path: "profile/orders" },
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
          title="Order History"
          count={orders.length}
          countLabel={orders.length === 1 ? "order" : "orders"}
          isEmpty={orders.length === 0}
          emptyIcon={<ShoppingBagIcon className="w-6 h-6 text-neutral-500" />}
          emptyMessage="No orders yet"
        >
          {orders.map((order, index) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric", year: "numeric" }
            );

            return (
              <ProfileTableRow
                key={order.id}
                href={`/profile/orders/${order.id}`}
                index={index}
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm text-neutral-400">{formattedDate}</div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || "bg-gray-500/20 text-gray-400"}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="text-neutral-200 font-medium">
                  {formatCurrency(order.totalAmount)}
                </div>
              </ProfileTableRow>
            );
          })}
        </ProfileTable>
      </InnerPage>
    </OuterPage>
  );
}
