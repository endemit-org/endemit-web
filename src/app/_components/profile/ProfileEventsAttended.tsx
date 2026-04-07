"use client";

import { useState } from "react";
import EventMiniCard from "@/app/_components/event/EventMiniCard";
import EventClaimModal from "@/app/_components/profile/EventClaimModal";

interface EventData {
  id: string;
  uid: string;
  name: string;
  dateStart: Date | null;
  dateEnd: Date | null;
  image: { src: string; alt: string | null; placeholder: string } | null;
  link: string;
}

interface PendingClaim {
  id: string;
  eventId: string;
  eventName: string;
}

interface ClaimableEvent {
  id: string;
  name: string;
  dateStart: Date | null;
}

interface ProfileEventsAttendedProps {
  events: EventData[];
  artistNames?: string[];
  pendingClaims?: PendingClaim[];
  claimableEvents?: ClaimableEvent[];
}

export default function ProfileEventsAttended({
  events,
  artistNames = [],
  pendingClaims = [],
  claimableEvents = [],
}: ProfileEventsAttendedProps) {
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [localPendingClaims, setLocalPendingClaims] = useState(pendingClaims);

  const handleClaim = async (eventId: string, eventName: string) => {
    const response = await fetch("/api/v1/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, eventName }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to submit claim");
    }

    const { claim } = await response.json();
    setLocalPendingClaims((prev) => [...prev, claim]);
  };

  const pendingClaimIds = localPendingClaims.map((c) => c.eventId);
  const hasClaimableEvents = claimableEvents.some(
    (e) => !pendingClaimIds.includes(e.id)
  );

  // If no events and no pending claims, show minimal state with claim option
  if (events.length === 0 && localPendingClaims.length === 0) {
    if (!hasClaimableEvents) {
      return null;
    }

    return (
      <div className="bg-neutral-900 rounded-lg overflow-hidden p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-200">
            Events Attended
          </h3>
          <button
            onClick={() => setIsClaimModalOpen(true)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Claim missing event
          </button>
        </div>
        <p className="text-neutral-400 text-sm">No events attended yet.</p>

        <EventClaimModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          claimableEvents={claimableEvents}
          pendingClaimIds={pendingClaimIds}
          onClaim={handleClaim}
        />
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-neutral-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-200">
              Events Attended
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              {events.length} {events.length === 1 ? "event" : "events"}
            </p>
          </div>
          {hasClaimableEvents && (
            <button
              onClick={() => setIsClaimModalOpen(true)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Claim missing event
            </button>
          )}
        </div>
      </div>

      {/* Pending Claims Banner */}
      {localPendingClaims.length > 0 && (
        <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/30">
          <p className="text-sm text-yellow-200 font-medium mb-2">
            Pending Claims
          </p>
          <div className="space-y-1">
            {localPendingClaims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-center gap-2 text-sm text-yellow-300/80"
              >
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                {claim.eventName}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventMiniCard
              key={event.id}
              name={event.name}
              dateStart={event.dateStart}
              dateEnd={event.dateEnd}
              image={event.image}
              link={event.link || null}
            />
          ))}
        </div>
      </div>

      {artistNames.length > 0 && (
        <div className="p-4 border-t border-neutral-700">
          <div className="flex items-baseline gap-2 mb-2">
            <h4 className="text-sm font-medium text-neutral-400">
              Artists at events
            </h4>
            <span className="text-xs text-neutral-500">
              {artistNames.length}
            </span>
          </div>
          <p className="text-lg text-neutral-300 leading-relaxed font-heading font-bold">
            {artistNames.join(" · ")}
          </p>
        </div>
      )}

      <EventClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        claimableEvents={claimableEvents}
        pendingClaimIds={pendingClaimIds}
        onClaim={handleClaim}
      />
    </div>
  );
}
