import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/services/auth";
import { getOrdersByUserId } from "@/domain/order/operations/getOrdersByUserId";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import MyOrdersDisplay from "@/app/_components/profile/MyOrdersDisplay";

export const metadata: Metadata = {
  title: "Orders",
  description: "View your order history",
  robots: {
    index: false,
    follow: false,
  },
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
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </span>
          </div>

          <MyOrdersDisplay orders={orders} />
        </div>
      </InnerPage>
    </OuterPage>
  );
}
