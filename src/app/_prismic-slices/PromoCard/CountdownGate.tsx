"use client";

import { useEffect, useState } from "react";

interface Props {
  /** ISO timestamp the card counts down to. */
  deadline: string;
  children: React.ReactNode;
}

function remainingMs(deadline: string): number {
  return new Date(deadline).getTime() - Date.now();
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const seconds = total % 60;
  const hms = [hours, minutes, seconds]
    .map(v => String(v).padStart(2, "0"))
    .join(":");
  return days > 0 ? `${days}d ${hms}` : hms;
}

/**
 * Shows its children with a live countdown chip until the deadline, then
 * renders nothing — an expired promo disappears even on cached pages. The
 * server already skips rendering when the deadline has passed; this covers
 * pages that were built before it did.
 */
export default function CountdownGate({ deadline, children }: Props) {
  // null until mounted: SSR and the first client render agree (no chip, card
  // visible), then the ticking starts.
  const [msLeft, setMsLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setMsLeft(remainingMs(deadline));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (msLeft !== null && msLeft <= 0) return null;

  return (
    <div className="relative">
      {msLeft !== null && (
        <div className="absolute top-2 right-2 z-10 rounded-md bg-black/70 backdrop-blur-sm px-2 py-1 text-[11px] font-mono tabular-nums text-neutral-100 border border-neutral-700/60 pointer-events-none">
          {formatRemaining(msLeft)}
        </div>
      )}
      {children}
    </div>
  );
}
