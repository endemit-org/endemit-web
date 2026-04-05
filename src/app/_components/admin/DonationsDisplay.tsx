"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { formatPrice, formatEmailForDisplay } from "@/lib/util/formatting";
import ClientDate from "@/app/_components/ui/ClientDate";
import Pagination from "@/app/_components/table/Pagination";
import { fetchDonations } from "@/domain/order/actions/fetchDonationsAction";
import type {
  PaginatedDonations,
  DonationItem,
} from "@/domain/order/operations/getAllDonations";

interface DonationsDisplayProps {
  initialData: PaginatedDonations;
}

export default function DonationsDisplay({
  initialData,
}: DonationsDisplayProps) {
  const [donations, setDonations] = useState<DonationItem[]>(initialData.donations);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [totalAmount, setTotalAmount] = useState(initialData.totalAmount);
  const [isLoading, setIsLoading] = useState(false);

  const loadPage = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const data = await fetchDonations(page);
      setDonations(data.donations);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
      setTotalAmount(data.totalAmount);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePageChange = (page: number) => {
    loadPage(page);
  };

  const handleRefresh = () => {
    loadPage(currentPage);
  };

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
            Count: <strong className="text-gray-900">{totalCount}</strong>
          </div>
          <div className="text-sm text-gray-600">
            Showing: <strong className="text-gray-900">{donations.length}</strong>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
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
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Order
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
                      <ClientDate date={donation.createdAt} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {donation.orderName || "Anonymous"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatEmailForDisplay(donation.orderEmail)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-right font-medium text-green-600">
                      {formatPrice(donation.amount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-right">
                      <Link
                        href={`/admin/orders/${donation.orderId}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    </div>
  );
}
