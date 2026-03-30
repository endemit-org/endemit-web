"use client";

import { useMemo } from "react";
import clsx from "clsx";

interface EventUrgencyBarProps {
  eventStartDate: Date;
  showDemo?: boolean;
}

// Constants for the urgency calculation
const TOTAL_HOURS = 21 * 24; // 21 days in hours (504)
const RED_THRESHOLD_HOURS = 6 * 24; // Last 6 days in hours (144)
const START_VALUE = 500;
const MIN_VALUE = 39; // ~5% of 770
const MAX_VALUE = 770;

function UrgencyBarDisplay({
  percentage,
  isRedPhase,
  label,
}: {
  percentage: number;
  isRedPhase: boolean;
  label?: string;
}) {
  return (
    <div className="mb-3 p-2 backdrop-blur-[1px] rounded-sm">
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={clsx(
            "text-sm font-medium text-center w-full mb-1",
            isRedPhase ? "text-red-400" : "text-neutral-300"
          )}
        >
          {isRedPhase
            ? "Almost sold out, final batch"
            : "Tickets going fast, remaining:"}
        </span>
        {label && <span className="text-xs text-neutral-500">{label}</span>}
      </div>
      <div className="h-2 bg-neutral-700 rounded-full overflow-hidden flex justify-end mb-1">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-500 animate-subtle-pulse",
            isRedPhase
              ? "bg-gradient-to-l from-red-600 to-red-400"
              : "bg-gradient-to-l from-yellow-600 to-yellow-400"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function EventUrgencyBar({
  eventStartDate,
  showDemo = false,
}: EventUrgencyBarProps) {
  const { shouldShow, percentage, isRedPhase } = useMemo(() => {
    const now = new Date();
    const hoursUntilEvent =
      (eventStartDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Hide if more than 21 days away or event has passed
    if (hoursUntilEvent > TOTAL_HOURS || hoursUntilEvent <= 0) {
      return { shouldShow: false, percentage: 0, isRedPhase: false };
    }

    // Calculate hours elapsed since the 21-day mark
    const hoursElapsed = TOTAL_HOURS - hoursUntilEvent;

    // Linear decrease from START_VALUE to MIN_VALUE over TOTAL_HOURS
    const decreasePerHour = (START_VALUE - MIN_VALUE) / TOTAL_HOURS;
    const currentValue = Math.max(
      MIN_VALUE,
      START_VALUE - hoursElapsed * decreasePerHour
    );

    // Calculate percentage based on MAX_VALUE (770)
    const pct = (currentValue / MAX_VALUE) * 100;

    // Red phase is last 6 days
    const red = hoursUntilEvent <= RED_THRESHOLD_HOURS;

    return { shouldShow: true, percentage: pct, isRedPhase: red };
  }, [eventStartDate]);

  // Demo mode: show multiple states for preview
  if (showDemo) {
    return (
      <div className="space-y-4 p-4 bg-neutral-800/50 rounded-lg">
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
          Demo States (remove showDemo prop)
        </p>
        <UrgencyBarDisplay
          percentage={65}
          isRedPhase={false}
          label="21 days out (start)"
        />
        <UrgencyBarDisplay
          percentage={45}
          isRedPhase={false}
          label="14 days out"
        />
        <UrgencyBarDisplay
          percentage={28}
          isRedPhase={false}
          label="7 days out"
        />
        <UrgencyBarDisplay
          percentage={18}
          isRedPhase={true}
          label="5 days out (red)"
        />
        <UrgencyBarDisplay
          percentage={10}
          isRedPhase={true}
          label="2 days out"
        />
        <UrgencyBarDisplay
          percentage={5}
          isRedPhase={true}
          label="Event day (min)"
        />
      </div>
    );
  }

  if (!shouldShow) {
    return null;
  }

  return <UrgencyBarDisplay percentage={percentage} isRedPhase={isRedPhase} />;
}
