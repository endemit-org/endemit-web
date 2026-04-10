"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { revertTicketScanAction } from "@/domain/ticket/actions/revertTicketScanAction";

interface RevertTicketScanButtonProps {
  ticketId: string;
}

export default function RevertTicketScanButton({
  ticketId,
}: RevertTicketScanButtonProps) {
  const router = useRouter();
  const [isReverting, setIsReverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRevert = async () => {
    setIsReverting(true);
    setError(null);

    try {
      const result = await revertTicketScanAction({ ticketId });

      if (!result.success) {
        setError(result.message);
        setShowConfirm(false);
        return;
      }

      // Refresh the page to show updated status
      router.refresh();
      setShowConfirm(false);
    } catch (err) {
      console.error("Revert error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to revert ticket scan"
      );
      setShowConfirm(false);
    } finally {
      setIsReverting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-600">
          Are you sure you want to revert the scan? The ticket will be marked as
          pending again.
        </p>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleRevert}
            disabled={isReverting}
          >
            {isReverting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Reverting...
              </>
            ) : (
              "Confirm Revert"
            )}
          </button>
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
            onClick={() => setShowConfirm(false)}
            disabled={isReverting}
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        onClick={() => setShowConfirm(true)}
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
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        </svg>
        Revert Scan
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
