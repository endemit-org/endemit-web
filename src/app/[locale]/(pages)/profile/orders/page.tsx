import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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

const statusLabelKeys: Record<string, string> = {
  PAID: "status.order.paid",
  CREATED: "status.order.created",
  CANCELLED: "status.order.cancelled",
  REFUNDED: "status.order.refunded",
  EXPIRED: "status.order.expired",
  SHIPPED: "status.order.shipped",
  DELIVERED: "status.order.delivered",
};

export default async function ProfileOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "sl" | "en");
  const t = await getTranslations("profile");
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const orders = await getOrdersByUserId(user.id);

  return (
    <OuterPage>
      <PageHeadline
        title={t("breadcrumb.orders")}
        segments={[
          { label: "Endemit", path: "" },
          { label: t("breadcrumb.myProfile"), path: "profile" },
          { label: t("breadcrumb.orders"), path: "orders" },
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
            {t("nav.backToProfile")}
          </Link>
        </div>

        <ProfileTable
          title={t("orders.historyTitle")}
          count={orders.length}
          countLabel={t("orders.countLabel", { count: orders.length })}
          isEmpty={orders.length === 0}
          emptyIcon={<ShoppingBagIcon className="w-6 h-6 text-neutral-500" />}
          emptyMessage={t("orders.empty")}
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
                  <div className="text-sm text-neutral-400">
                    {formattedDate}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || "bg-gray-500/20 text-gray-400"}`}
                  >
                    {statusLabelKeys[order.status]
                      ? t(
                          statusLabelKeys[
                            order.status
                          ] as Parameters<typeof t>[0]
                        )
                      : order.status}
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
