"use client";

import { useState, useTransition } from "react";
import type { PosItem, PosItemDirection, PosItemStatus } from "@prisma/client";
import type { PosItemWithSalesCount } from "@/domain/pos/operations/getAllPosItems";
import { createPosItemAction } from "@/domain/pos/actions/createPosItemAction";
import { updatePosItemAction } from "@/domain/pos/actions/updatePosItemAction";
import { formatTokensFromCents, TOKEN_CONFIG } from "@/lib/util/currency";

interface Props {
  initialItems: PosItemWithSalesCount[];
  canWrite: boolean;
}

function formatPrice(cents: number | undefined | null): string {
  return formatTokensFromCents(cents ?? 0);
}

export default function PosItemsDisplay({ initialItems, canWrite }: Props) {
  const [items, setItems] = useState<PosItemWithSalesCount[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PosItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = async (formData: FormData) => {
    const input = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      cost: Math.round(parseFloat(formData.get("cost") as string) * 100),
      direction: formData.get("direction") as PosItemDirection,
      status: formData.get("status") as PosItemStatus,
    };

    startTransition(async () => {
      const item = await createPosItemAction(input);
      setItems(prev => [...prev, { ...item, soldLast30Days: 0, revenueLast30Days: 0 }]);
      setShowForm(false);
    });
  };

  const handleUpdate = async (formData: FormData) => {
    if (!editingItem) return;

    const input = {
      id: editingItem.id,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      cost: Math.round(parseFloat(formData.get("cost") as string) * 100),
      direction: formData.get("direction") as PosItemDirection,
      status: formData.get("status") as PosItemStatus,
    };

    startTransition(async () => {
      const updated = await updatePosItemAction(input);
      setItems(prev =>
        prev.map(i =>
          i.id === updated.id
            ? { ...updated, soldLast30Days: i.soldLast30Days, revenueLast30Days: i.revenueLast30Days }
            : i
        )
      );
      setEditingItem(null);
    });
  };

  const ItemForm = ({
    item,
    onSubmit,
    onCancel,
  }: {
    item?: PosItem;
    onSubmit: (formData: FormData) => void;
    onCancel: () => void;
  }) => (
    <form
      action={onSubmit}
      className="bg-white rounded-lg shadow p-6 space-y-4"
    >
      <h3 className="text-lg font-medium">
        {item ? "Edit Item" : "New Item"}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={item?.name}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price ({TOKEN_CONFIG.symbol})
          </label>
          <input
            name="cost"
            type="number"
            step="0.01"
            required
            defaultValue={item ? (item.cost / 100).toFixed(2) : ""}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Direction
          </label>
          <select
            name="direction"
            defaultValue={item?.direction ?? "DEBIT"}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="DEBIT">Debit (charge customer)</option>
            <option value="CREDIT">Credit (refund/payout)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="status"
            defaultValue={item?.status ?? "ACTIVE"}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            name="description"
            type="text"
            defaultValue={item?.description ?? ""}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : item ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {canWrite && !showForm && !editingItem && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Add Item
        </button>
      )}

      {showForm && (
        <ItemForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {editingItem && (
        <ItemForm
          item={editingItem}
          onSubmit={handleUpdate}
          onCancel={() => setEditingItem(null)}
        />
      )}

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Direction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sold (30d)
              </th>
              {canWrite && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.name}
                  </div>
                  {item.description && (
                    <div className="text-sm text-gray-500">
                      {item.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPrice(item.cost)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.direction === "DEBIT"
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {item.direction}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="text-gray-900">{item.soldLast30Days ?? 0} sold</div>
                  <div className="text-gray-500">{formatPrice(item.revenueLast30Days ?? 0)}</div>
                </td>
                {canWrite && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={canWrite ? 6 : 5}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No items found. Add your first item to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
