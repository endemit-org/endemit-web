"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import UserAutocomplete from "@/app/_components/admin/UserAutocomplete";
import type { UserSearchResult } from "@/domain/user/actions/searchUsersAction";

interface Props {
  isOpen: boolean;
  code: string | null;
  onClose: () => void;
}

export default function AssignStickerToUserModal({
  isOpen,
  code,
  onClose,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const reset = useCallback(() => {
    setSearch("");
    setSelectedUser(null);
    setError(null);
    setWarning(null);
  }, []);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    reset();
    onClose();
  }, [isSubmitting, onClose, reset]);

  const handleAssign = useCallback(async () => {
    if (!code || !selectedUser || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setWarning(null);

    try {
      const response = await fetch(
        `/api/v1/admin/users/${selectedUser.id}/sticker`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to assign sticker");
      }
      if (data.replacedCode) {
        setWarning(
          `Sticker assigned. The user's previous sticker (${data.replacedCode}) was unlinked.`
        );
      }
      router.refresh();
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign sticker");
    } finally {
      setIsSubmitting(false);
    }
  }, [code, selectedUser, isSubmitting, router, reset, onClose]);

  if (!isOpen || !code) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Assign Sticker
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Code:{" "}
              <span className="font-mono font-semibold tracking-[0.2em] text-gray-800">
                {code}
              </span>
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 disabled:opacity-50"
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

        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign to user
          </label>
          <UserAutocomplete
            value={search}
            onChange={setSearch}
            onUserSelect={setSelectedUser}
            placeholder="Search by name, email, or username"
            disabled={isSubmitting}
          />

          {warning && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
              {warning}
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedUser || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
