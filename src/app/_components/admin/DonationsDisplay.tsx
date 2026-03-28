"use client";

import { formatPrice, formatDateTime } from "@/lib/util/formatting";
import type { DonationsData } from "@/domain/order/actions/fetchDonationsAction";

interface DonationsDisplayProps {
  initialData: DonationsData;
}

export default function DonationsDisplay({
  initialData,
}: DonationsDisplayProps) {
  const { donations, totalAmount, count } = initialData;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-sm text-gray-600">
            Total Donations:{" "}
            <strong className="text-green-600 text-lg">
              {formatPrice(totalAmount)}
            </strong>
          </div>
          <div className="text-sm text-gray-600">
            Count: <strong className="text-gray-900">{count}</strong>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        {donations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Donor
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {donations.map((donation, index) => (
                  <tr
                    key={`${donation.orderId}-${index}`}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDateTime(new Date(donation.createdAt))}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {donation.orderName || "Anonymous"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {donation.orderEmail}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-right font-medium text-green-600">
                      {formatPrice(donation.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No donations found
          </div>
        )}
      </div>
    </div>
  );
}
