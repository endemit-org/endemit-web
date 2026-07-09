"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { PosOrderStatus } from "@prisma/client";
import type { PosOrderWithRelations } from "@/domain/pos/operations/getAllPosOrders";
import { fetchPosOrdersAction } from "@/domain/pos/actions/fetchPosOrdersAction";
import { formatTokensFromCents } from "@/lib/util/currency";
import { formatEmailForDisplay } from "@/lib/util/formatting";
import ClientDate from "@/app/_components/ui/ClientDate";

interface Props {
  initialOrders: PosOrderWithRelations[];
  initialPage: number;
  totalPages: number;
  totalCount: number;
  registers: Array<{ id: string; name: string }>;
}

function formatPrice(cents: number): string {
  return formatTokensFromCents(cents);
}

const statusStyles: Record<PosOrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function PosOrdersDisplay({
  initialOrders,
  initialPage,
  totalPages: initialTotalPages,
  totalCount: initialTotalCount,
  registers,
}: Props) {
  const t = useTranslations("admin.pos.orders");
  const tt = useTranslations("common.table");
  const [orders, setOrders] = useState(initialOrders);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [statusFilter, setStatusFilter] = useState<PosOrderStatus | "">("");
  const [registerFilter, setRegisterFilter] = useState("");
  const [selectedOrder, setSelectedOrder] =
    useState<PosOrderWithRelations | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadOrders = (newPage: number) => {
    startTransition(async () => {
      const result = await fetchPosOrdersAction({
        page: newPage,
        status: statusFilter || undefined,
        registerId: registerFilter || undefined,
      });
      setOrders(result.orders);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    });
  };

  const handleFilterChange = () => {
    loadOrders(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("filterStatus")}
            </label>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as PosOrderStatus | "");
                setTimeout(handleFilterChange, 0);
              }}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">{t("allStatuses")}</option>
              <option value="PENDING">{t("statusPending")}</option>
              <option value="PAID">{t("statusPaid")}</option>
              <option value="CANCELLED">{t("statusCancelled")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("filterRegister")}
            </label>
            <select
              value={registerFilter}
              onChange={e => {
                setRegisterFilter(e.target.value);
                setTimeout(handleFilterChange, 0);
              }}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">{t("allRegisters")}</option>
              {registers.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-500">
            {t("ordersFound", { count: totalCount })}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colOrder")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colRegister")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colCustomer")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colTotal")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colStatus")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colCreated")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colActions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map(order => (
              <tr key={order.id} className={isPending ? "opacity-50" : ""}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-mono text-sm font-medium text-gray-900">
                    {order.shortCode}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t("itemsCount", { count: order.items.length })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.register.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.customer ? (
                    <div>
                      <div className="text-gray-900">
                        {order.customer.name || t("unnamed")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.customer.email ? formatEmailForDisplay(order.customer.email, "") : ""}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">{t("noCustomer")}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-medium text-gray-900">
                    {formatPrice(order.total)}
                  </div>
                  {order.tipAmount > 0 && (
                    <div className="text-xs text-green-600">
                      {t("tipSuffix", { amount: formatPrice(order.tipAmount) })}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      statusStyles[order.status]
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <ClientDate date={order.createdAt} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    {t("details")}
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  {t("emptyOrders")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => loadOrders(page - 1)}
            disabled={page <= 1 || isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("previous")}
          </button>
          <span className="text-sm text-gray-700">
            {tt("pageOf", { current: page, total: totalPages })}
          </span>
          <button
            onClick={() => loadOrders(page + 1)}
            disabled={page >= totalPages || isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("next")}
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {t("modalOrder", { code: selectedOrder.shortCode })}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t("labelStatus")}</span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        statusStyles[selectedOrder.status]
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">{t("labelRegister")}</span>
                  <div className="mt-1 font-medium">
                    {selectedOrder.register.name}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">{t("labelSeller")}</span>
                  <div className="mt-1 font-medium">
                    {selectedOrder.seller.name || formatEmailForDisplay(selectedOrder.seller.email, t("unknown"))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">{t("labelCustomer")}</span>
                  <div className="mt-1 font-medium">
                    {selectedOrder.customer
                      ? selectedOrder.customer.name ||
                        formatEmailForDisplay(selectedOrder.customer.email, t("unknown"))
                      : t("none")}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">{t("labelCreated")}</span>
                  <div className="mt-1"><ClientDate date={selectedOrder.createdAt} /></div>
                </div>
                {selectedOrder.paidAt && (
                  <div>
                    <span className="text-gray-500">{t("labelPaid")}</span>
                    <div className="mt-1"><ClientDate date={selectedOrder.paidAt} /></div>
                  </div>
                )}
                {selectedOrder.cancelledAt && (
                  <div className="col-span-2">
                    <span className="text-gray-500">{t("labelCancelled")}</span>
                    <div className="mt-1">
                      <ClientDate date={selectedOrder.cancelledAt} />
                      {selectedOrder.cancelReason && (
                        <span className="text-gray-500 ml-2">
                          ({selectedOrder.cancelReason})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">{t("itemsHeading")}</h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items.map(item => (
                    <div
                      key={item.id}
                      className="px-4 py-2 flex justify-between text-sm"
                    >
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium">
                        {formatPrice(item.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("subtotal")}</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.tipAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t("tip")}</span>
                    <span className="text-green-600">
                      {formatPrice(selectedOrder.tipAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>{t("total")}</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
