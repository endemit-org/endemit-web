import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import Link from "next/link";
import type { Metadata } from "next";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export const metadata: Metadata = {
  title: "POS - Select Register",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin?redirect=/pos");
  }

  const assignments = await prisma.posRegisterSeller.findMany({
    where: { userId: user.id },
    include: {
      register: {
        include: {
          items: {
            where: { item: { status: "ACTIVE" } },
          },
          _count: {
            select: { orders: { where: { status: "PENDING" } } },
          },
          orders: {
            where: { status: "PAID" },
            select: {
              tipAmount: true,
              items: {
                select: {
                  total: true,
                  item: {
                    select: {
                      direction: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const registers = assignments
    .map(a => {
      const paidOrders = a.register.orders;
      let salesRevenue = 0;
      let topUpsProcessed = 0;
      let totalTips = 0;

      for (const order of paidOrders) {
        totalTips += order.tipAmount;
        for (const item of order.items) {
          if (item.item.direction === "DEBIT") {
            salesRevenue += item.total;
          } else {
            topUpsProcessed += item.total;
          }
        }
      }

      return {
        ...a.register,
        stats: {
          salesRevenue,
          topUpsProcessed,
          tips: totalTips,
          sales: paidOrders.length,
        },
      };
    })
    .filter(r => r.status === "ACTIVE");

  // If only one register, redirect directly to it
  if (registers.length === 1) {
    redirect(`/pos/${registers[0].id}`);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            Select Register
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Choose a register to start selling
          </p>
        </div>

        {registers.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              No registers assigned
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Contact an administrator to be assigned to a register.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {registers.map(register => (
              <li key={register.id}>
                <Link
                  href={`/pos/${register.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">
                          {register.name}
                        </h2>
                        {register.description && (
                          <p className="mt-1 text-sm text-gray-500">
                            {register.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span>{register.items.length} items</span>
                          {register.canTopUp && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Top-up enabled
                            </span>
                          )}
                        </div>
                        {register.stats.sales > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span className="text-gray-500">
                              {register.stats.sales} {register.stats.sales === 1 ? "sale" : "sales"}
                            </span>
                            {register.stats.salesRevenue > 0 && (
                              <span className="text-gray-900 font-medium">
                                {formatPrice(register.stats.salesRevenue)} revenue
                              </span>
                            )}
                            {register.stats.tips > 0 && (
                              <span className="text-amber-600 font-medium">
                                +{formatPrice(register.stats.tips)} tips
                              </span>
                            )}
                            {register.stats.topUpsProcessed > 0 && (
                              <span className="text-red-600 font-medium">
                                {formatPrice(register.stats.topUpsProcessed)} to collect
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {register._count.orders > 0 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {register._count.orders} pending
                          </span>
                        )}
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
