"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { formatPrice, formatEmailForDisplay } from "@/lib/util/formatting";
import ClientDate from "@/app/_components/ui/ClientDate";
import Pagination from "@/app/_components/table/Pagination";
import { fetchDonations } from "@/domain/order/actions/fetchDonationsAction";
import { fetchAggregatedDonors } from "@/domain/order/actions/fetchAggregatedDonorsAction";
import type {
  PaginatedDonations,
  DonationItem,
} from "@/domain/order/operations/getAllDonations";
import type {
  AggregatedDonorsResult,
  AggregatedDonor,
} from "@/domain/order/operations/getAggregatedDonors";

type Tab = "transactions" | "donors";

interface DonationsDisplayProps {
  initialData: PaginatedDonations;
  initialDonorsData: AggregatedDonorsResult;
}

export default function DonationsDisplay({
  initialData,
  initialDonorsData,
}: DonationsDisplayProps) {
  const [activeTab, setActiveTab] = useState<Tab>("transactions");

  // Transactions state
  const [donations, setDonations] = useState<DonationItem[]>(initialData.donations);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [totalAmount, setTotalAmount] = useState(initialData.totalAmount);
  const [isLoading, setIsLoading] = useState(false);

  // Donors state
  const [donors, setDonors] = useState<AggregatedDonor[]>(initialDonorsData.donors);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [expandedDonors, setExpandedDonors] = useState<Set<string>>(new Set());

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

  const handleRefresh = async () => {
    if (activeTab === "transactions") {
      loadPage(currentPage);
    } else {
      setDonorsLoading(true);
      try {
        const data = await fetchAggregatedDonors();
        setDonors(data.donors);
      } finally {
        setDonorsLoading(false);
      }
    }
  };

  const toggleDonorExpanded = (email: string) => {
    setExpandedDonors(prev => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const isLoadingAny = isLoading || donorsLoading;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "transactions"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab("donors")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "donors"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Donors ({donors.length})
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4 sm:gap-6">
          {activeTab === "transactions" ? (
            <>
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
            </>
          ) : (
            <>
              <div className="text-sm text-gray-600">
                Total Donors:{" "}
                <strong className="text-gray-900">{donors.length}</strong>
              </div>
              <div className="text-sm text-gray-600">
                Total Donated:{" "}
                <strong className="text-green-600 text-lg">
                  {formatPrice(initialDonorsData.totalAmount)}
                </strong>
              </div>
            </>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoadingAny}
          className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50"
        >
          {isLoadingAny ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <>
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
        </>
      )}

      {/* Donors Tab */}
      {activeTab === "donors" && (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {donors.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {donors.map((donor, index) => {
                const isExpanded = expandedDonors.has(donor.email);

                return (
                  <div key={donor.email}>
                    {/* Donor row */}
                    <button
                      onClick={() => toggleDonorExpanded(donor.email)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <svg
                            className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {donor.name || "Anonymous"}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {formatEmailForDisplay(donor.email)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <div className="text-xs text-gray-500">First</div>
                            <div className="text-sm text-gray-600">
                              <ClientDate date={donor.firstDonation} format="date" />
                            </div>
                          </div>
                          <div className="text-right hidden sm:block">
                            <div className="text-xs text-gray-500">Last</div>
                            <div className="text-sm text-gray-600">
                              <ClientDate date={donor.lastDonation} format="date" />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              {donor.donationCount} donation{donor.donationCount !== 1 ? "s" : ""}
                            </div>
                            <div className="text-lg font-semibold text-green-600">
                              {formatPrice(donor.totalAmount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded donations */}
                    {isExpanded && (
                      <div className="bg-gray-100 border-t border-gray-200">
                        <div className="px-4 py-2">
                          <table className="min-w-full">
                            <thead>
                              <tr>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">
                                  Date
                                </th>
                                <th className="text-right text-xs font-medium text-gray-500 uppercase py-2">
                                  Amount
                                </th>
                                <th className="text-right text-xs font-medium text-gray-500 uppercase py-2">
                                  Order
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {donor.donations.map((donation, i) => (
                                <tr key={`${donation.orderId}-${i}`}>
                                  <td className="py-2 text-sm text-gray-600">
                                    <ClientDate date={donation.createdAt} />
                                  </td>
                                  <td className="py-2 text-sm text-right font-medium text-green-600">
                                    {formatPrice(donation.amount)}
                                  </td>
                                  <td className="py-2 text-sm text-right">
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No donors found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
