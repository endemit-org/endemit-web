"use client";

import { useState, useMemo } from "react";
import clsx from "clsx";

interface ClaimableEvent {
  id: string;
  name: string;
  dateStart: Date | null;
}

interface EventClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimableEvents: ClaimableEvent[];
  pendingClaimIds: string[];
  onClaim: (eventId: string, eventName: string) => Promise<void>;
}

export default function EventClaimModal({
  isOpen,
  onClose,
  claimableEvents,
  pendingClaimIds,
  onClaim,
}: EventClaimModalProps) {
  const [selectedEvent, setSelectedEvent] = useState<ClaimableEvent | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out events that already have pending claims
  const availableEvents = useMemo(
    () => claimableEvents.filter((e) => !pendingClaimIds.includes(e.id)),
    [claimableEvents, pendingClaimIds]
  );

  const handleClaim = async () => {
    if (!selectedEvent) return;

    setIsLoading(true);
    setError(null);

    try {
      await onClaim(selectedEvent.id, selectedEvent.name);
      setSelectedEvent(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit claim");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedEvent(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={handleClose}
    >
      <div
        className="bg-neutral-900 rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-200">
            Claim Missing Event
          </h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
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

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {availableEvents.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-neutral-400">
              No past events available to claim.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-400 mb-4">
              Select an event you attended but don&apos;t have a ticket for.
              Claims are reviewed and typically approved within a few minutes.
            </p>

            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {availableEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={clsx(
                    "w-full p-3 rounded-lg border-2 transition-all text-left",
                    selectedEvent?.id === event.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
                  )}
                >
                  <div className="font-medium text-neutral-200">
                    {event.name}
                  </div>
                  {event.dateStart && (
                    <div className="text-sm text-neutral-400 mt-1">
                      {event.dateStart.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleClaim}
              disabled={!selectedEvent || isLoading}
              className={clsx(
                "w-full py-3 px-6 rounded-xl font-medium transition-colors",
                selectedEvent && !isLoading
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
              )}
            >
              {isLoading ? "Submitting..." : "Submit Claim"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
