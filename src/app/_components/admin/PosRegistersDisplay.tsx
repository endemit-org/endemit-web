"use client";

import { useState, useTransition } from "react";
import type { PosItem, PosRegisterStatus } from "@prisma/client";
import type { PosRegisterWithRelations } from "@/domain/pos/operations/getAllPosRegisters";
import { createPosRegisterAction } from "@/domain/pos/actions/createPosRegisterAction";
import { updatePosRegisterAction } from "@/domain/pos/actions/updatePosRegisterAction";
import { assignItemToRegisterAction } from "@/domain/pos/actions/assignItemToRegisterAction";
import { removeItemFromRegisterAction } from "@/domain/pos/actions/removeItemFromRegisterAction";
import { assignSellerToRegisterAction } from "@/domain/pos/actions/assignSellerToRegisterAction";
import { removeSellerFromRegisterAction } from "@/domain/pos/actions/removeSellerFromRegisterAction";
import { formatTokensFromCents } from "@/lib/util/currency";

interface Props {
  initialRegisters: PosRegisterWithRelations[];
  allItems: PosItem[];
  allUsers: Array<{ id: string; name: string | null; email: string }>;
  canWrite: boolean;
}

function formatPrice(cents: number): string {
  return formatTokensFromCents(cents);
}

export default function PosRegistersDisplay({
  initialRegisters,
  allItems,
  allUsers,
  canWrite,
}: Props) {
  const [registers, setRegisters] = useState(initialRegisters);
  const [showForm, setShowForm] = useState(false);
  const [editingRegister, setEditingRegister] =
    useState<PosRegisterWithRelations | null>(null);
  const [managingRegister, setManagingRegister] =
    useState<PosRegisterWithRelations | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = async (formData: FormData) => {
    const input = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      status: formData.get("status") as PosRegisterStatus,
      canTopUp: formData.get("canTopUp") === "true",
    };

    startTransition(async () => {
      const register = await createPosRegisterAction(input);
      setRegisters(prev => [
        ...prev,
        {
          ...register,
          items: [],
          sellers: [],
          _count: { orders: 0 },
          traffic: {
            salesRevenue: 0,
            topUpsProcessed: 0,
            tipsCollected: 0,
            paidOrdersCount: 0,
          },
        },
      ]);
      setShowForm(false);
    });
  };

  const handleUpdate = async (formData: FormData) => {
    if (!editingRegister) return;

    const input = {
      id: editingRegister.id,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      status: formData.get("status") as PosRegisterStatus,
      canTopUp: formData.get("canTopUp") === "true",
    };

    startTransition(async () => {
      const updated = await updatePosRegisterAction(input);
      setRegisters(prev =>
        prev.map(r =>
          r.id === updated.id
            ? {
                ...r,
                ...updated,
              }
            : r
        )
      );
      setEditingRegister(null);
    });
  };

  const handleAssignItem = async (registerId: string, itemId: string) => {
    startTransition(async () => {
      await assignItemToRegisterAction(registerId, itemId);
      const item = allItems.find(i => i.id === itemId);
      if (item) {
        const newItem = {
          id: `temp-${Date.now()}`,
          itemId: item.id,
          item: {
            id: item.id,
            name: item.name,
            cost: item.cost,
            status: item.status as "ACTIVE" | "INACTIVE",
            direction: item.direction as "CREDIT" | "DEBIT",
          },
        };
        setRegisters(prev =>
          prev.map(r =>
            r.id === registerId
              ? {
                  ...r,
                  items: [...r.items, newItem],
                }
              : r
          )
        );
        if (managingRegister?.id === registerId) {
          setManagingRegister(prev =>
            prev
              ? {
                  ...prev,
                  items: [...prev.items, newItem],
                }
              : null
          );
        }
      }
    });
  };

  const handleRemoveItem = async (registerId: string, itemId: string) => {
    startTransition(async () => {
      await removeItemFromRegisterAction(registerId, itemId);
      setRegisters(prev =>
        prev.map(r =>
          r.id === registerId
            ? {
                ...r,
                items: r.items.filter(i => i.itemId !== itemId),
              }
            : r
        )
      );
      if (managingRegister?.id === registerId) {
        setManagingRegister(prev =>
          prev
            ? {
                ...prev,
                items: prev.items.filter(i => i.itemId !== itemId),
              }
            : null
        );
      }
    });
  };

  const handleAssignSeller = async (registerId: string, userId: string) => {
    startTransition(async () => {
      await assignSellerToRegisterAction(registerId, userId);
      const user = allUsers.find(u => u.id === userId);
      if (user) {
        setRegisters(prev =>
          prev.map(r =>
            r.id === registerId
              ? {
                  ...r,
                  sellers: [
                    ...r.sellers,
                    {
                      id: `temp-${Date.now()}`,
                      userId: user.id,
                      user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                      },
                    },
                  ],
                }
              : r
          )
        );
        if (managingRegister?.id === registerId) {
          setManagingRegister(prev =>
            prev
              ? {
                  ...prev,
                  sellers: [
                    ...prev.sellers,
                    {
                      id: `temp-${Date.now()}`,
                      userId: user.id,
                      user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                      },
                    },
                  ],
                }
              : null
          );
        }
      }
    });
  };

  const handleRemoveSeller = async (registerId: string, userId: string) => {
    startTransition(async () => {
      await removeSellerFromRegisterAction(registerId, userId);
      setRegisters(prev =>
        prev.map(r =>
          r.id === registerId
            ? {
                ...r,
                sellers: r.sellers.filter(s => s.userId !== userId),
              }
            : r
        )
      );
      if (managingRegister?.id === registerId) {
        setManagingRegister(prev =>
          prev
            ? {
                ...prev,
                sellers: prev.sellers.filter(s => s.userId !== userId),
              }
            : null
        );
      }
    });
  };

  const RegisterForm = ({
    register,
    onSubmit,
    onCancel,
  }: {
    register?: PosRegisterWithRelations;
    onSubmit: (formData: FormData) => void;
    onCancel: () => void;
  }) => (
    <form
      action={onSubmit}
      className="bg-white rounded-lg shadow p-6 space-y-4"
    >
      <h3 className="text-lg font-medium">
        {register ? "Edit Register" : "New Register"}
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
            defaultValue={register?.name}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="status"
            defaultValue={register?.status ?? "ACTIVE"}
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
            defaultValue={register?.description ?? ""}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2">
            <input
              name="canTopUp"
              type="checkbox"
              value="true"
              defaultChecked={register?.canTopUp}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Can process cash top-ups
            </span>
          </label>
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
          {isPending ? "Saving..." : register ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );

  const ManageModal = () => {
    if (!managingRegister) return null;

    const assignedItemIds = managingRegister.items.map(i => i.itemId);
    const availableItems = allItems.filter(
      i => !assignedItemIds.includes(i.id) && i.status === "ACTIVE"
    );

    const assignedSellerIds = managingRegister.sellers.map(s => s.userId);
    const availableUsers = allUsers.filter(
      u => !assignedSellerIds.includes(u.id)
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Manage: {managingRegister.name}
            </h2>
            <button
              onClick={() => setManagingRegister(null)}
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

          <div className="p-6 space-y-6">
            {/* Items Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Assigned Items
              </h3>
              <div className="space-y-2 mb-3">
                {managingRegister.items.map(({ item, itemId }) => (
                  <div
                    key={itemId}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2"
                  >
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500 ml-2">
                        {formatPrice(item.cost)}
                      </span>
                    </div>
                    {canWrite && (
                      <button
                        onClick={() =>
                          handleRemoveItem(managingRegister.id, itemId)
                        }
                        disabled={isPending}
                        className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {managingRegister.items.length === 0 && (
                  <p className="text-gray-500 text-sm">No items assigned</p>
                )}
              </div>
              {canWrite && availableItems.length > 0 && (
                <div className="flex gap-2">
                  <select
                    id="addItem"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select item to add...</option>
                    {availableItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {formatPrice(item.cost)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const select = document.getElementById(
                        "addItem"
                      ) as HTMLSelectElement;
                      if (select.value) {
                        handleAssignItem(managingRegister.id, select.value);
                        select.value = "";
                      }
                    }}
                    disabled={isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Sellers Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Assigned Sellers
              </h3>
              <div className="space-y-2 mb-3">
                {managingRegister.sellers.map(({ user, userId }) => (
                  <div
                    key={userId}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2"
                  >
                    <div>
                      <span className="font-medium">
                        {user.name || "Unnamed"}
                      </span>
                      <span className="text-gray-500 ml-2">{user.email || ""}</span>
                    </div>
                    {canWrite && (
                      <button
                        onClick={() =>
                          handleRemoveSeller(managingRegister.id, userId)
                        }
                        disabled={isPending}
                        className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {managingRegister.sellers.length === 0 && (
                  <p className="text-gray-500 text-sm">No sellers assigned</p>
                )}
              </div>
              {canWrite && availableUsers.length > 0 && (
                <div className="flex gap-2">
                  <select
                    id="addSeller"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select user to add...</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email} ({user.email})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const select = document.getElementById(
                        "addSeller"
                      ) as HTMLSelectElement;
                      if (select.value) {
                        handleAssignSeller(managingRegister.id, select.value);
                        select.value = "";
                      }
                    }}
                    disabled={isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {canWrite && !showForm && !editingRegister && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Add Register
        </button>
      )}

      {showForm && (
        <RegisterForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingRegister && (
        <RegisterForm
          register={editingRegister}
          onSubmit={handleUpdate}
          onCancel={() => setEditingRegister(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {registers.map(register => (
          <div
            key={register.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{register.name}</h3>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    register.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {register.status}
                </span>
              </div>
              {register.description && (
                <p className="text-sm text-gray-500">{register.description}</p>
              )}
            </div>

            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Items / Sellers:</span>
                <span className="font-medium">
                  {register.items.length} / {register.sellers.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sales:</span>
                <span className="font-medium">
                  {register.traffic.paidOrdersCount} ({formatPrice(register.traffic.salesRevenue)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tips:</span>
                <span className="font-medium text-amber-600">
                  {formatPrice(register.traffic.tipsCollected)}
                </span>
              </div>
              {register.canTopUp && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cash to Collect:</span>
                  <span className="font-medium text-red-600">
                    {formatPrice(register.traffic.topUpsProcessed)}
                  </span>
                </div>
              )}
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t flex gap-2">
              <button
                onClick={() => setManagingRegister(register)}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
              >
                Manage
              </button>
              {canWrite && (
                <button
                  onClick={() => setEditingRegister(register)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}

        {registers.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No registers found. Create your first register to get started.
          </div>
        )}
      </div>

      <ManageModal />
    </div>
  );
}
