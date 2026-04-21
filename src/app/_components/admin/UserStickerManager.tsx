"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  currentCode: string | null;
  claimedAt: string | null;
}

export default function UserStickerManager({
  userId,
  currentCode,
  claimedAt,
}: Props) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  const openModal = useCallback(() => {
    setCodeInput("");
    setError(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (isBusy) return;
    setIsModalOpen(false);
  }, [isBusy]);

  const submitCode = useCallback(
    async (raw: string) => {
      const code = raw.trim().toUpperCase();
      if (!code || isBusy) return;
      if (!/^[A-Z]{2}[0-9]{2}$/.test(code)) {
        setError("Code must be 2 letters followed by 2 numbers (e.g. AB12)");
        return;
      }

      setIsBusy(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/v1/admin/users/${userId}/sticker`,
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
        setIsModalOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to assign sticker");
      } finally {
        setIsBusy(false);
      }
    },
    [isBusy, router, userId]
  );

  const handleUnlink = useCallback(async () => {
    if (!confirm("Unlink this sticker from the user?")) return;
    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/admin/users/${userId}/sticker`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to unlink sticker");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink sticker");
    } finally {
      setIsBusy(false);
    }
  }, [router, userId]);

  return (
    <div className="space-y-3">
      {currentCode ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-2xl font-mono font-bold tracking-[0.3em] text-gray-900">
              {currentCode}
            </p>
            {claimedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Linked on {new Date(claimedAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={openModal}
              disabled={isBusy}
              className="px-3 py-1.5 text-sm border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md transition-colors disabled:opacity-50"
            >
              Replace
            </button>
            <button
              onClick={handleUnlink}
              disabled={isBusy}
              className="px-3 py-1.5 text-sm text-red-600 border border-red-300 hover:border-red-500 rounded-md transition-colors disabled:opacity-50"
            >
              Unlink
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">No sticker linked</p>
          <button
            onClick={openModal}
            disabled={isBusy}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
          >
            Assign sticker
          </button>
        </div>
      )}

      {error && !isModalOpen && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                {currentCode ? "Replace Sticker" : "Assign Sticker"}
              </h3>
              <button
                onClick={closeModal}
                disabled={isBusy}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50"
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
              <p className="text-sm text-gray-600 mb-4">
                Enter the 4-character code from the sticker.
              </p>
              <input
                type="text"
                placeholder="AB12"
                maxLength={4}
                autoFocus
                value={codeInput}
                disabled={isBusy}
                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    submitCode(codeInput);
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                style={{ letterSpacing: "0.3em" }}
              />

              {error && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={closeModal}
                  disabled={isBusy}
                  className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitCode(codeInput)}
                  disabled={isBusy || codeInput.length !== 4}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                >
                  {isBusy ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
