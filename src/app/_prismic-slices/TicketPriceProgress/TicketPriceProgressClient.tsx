"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/util/formatting";
import clsx from "clsx";

export interface PriceStepData {
  title: string;
  description: string | null;
  price: number | null;
  availableFrom: string | null;
  availableUntil: string | null;
  isVisible: boolean;
}

type StepState = "completed" | "current" | "next" | "future";

interface ProcessedStep extends PriceStepData {
  state: StepState;
}

interface Props {
  heading: string | null;
  subheading: string | null;
  steps: PriceStepData[];
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}${getOrdinalSuffix(day)}`;
}

function processSteps(steps: PriceStepData[], now: Date): ProcessedStep[] {
  const processed: ProcessedStep[] = steps.map((step) => {
    const availableFrom = step.availableFrom
      ? new Date(step.availableFrom)
      : null;
    const availableUntil = step.availableUntil
      ? new Date(step.availableUntil)
      : null;

    // Determine state based on dates
    let state: StepState;

    if (availableUntil && now > availableUntil) {
      // Past the end date
      state = "completed";
    } else if (
      (!availableFrom || now >= availableFrom) &&
      (!availableUntil || now <= availableUntil)
    ) {
      // Within the date range
      state = "current";
    } else {
      // Future step
      state = "future";
    }

    return {
      ...step,
      state,
    };
  });

  // Check if we're in a gap (no current step)
  const hasCurrentStep = processed.some((s) => s.state === "current");

  if (!hasCurrentStep) {
    // Find the first future step and mark it as "next"
    const firstFuture = processed.find((s) => s.state === "future");
    if (firstFuture) {
      firstFuture.state = "next";
    }
  }

  return processed;
}

function StepDot({ state }: { state: StepState }) {
  return (
    <div
      className={clsx(
        "w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all",
        state === "completed" && "bg-neutral-500 border-neutral-500",
        state === "current" && "bg-white border-green-500 ring-4 ring-green-500/20",
        state === "next" && "bg-yellow-500 border-yellow-500 ring-4 ring-yellow-500/20",
        state === "future" && "bg-neutral-700 border-neutral-600"
      )}
    >
      {state === "completed" && (
        <svg
          className="w-full h-full text-white p-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
      {state === "current" && (
        <div className="w-full h-full rounded-full bg-green-500 scale-50" />
      )}
      {state === "next" && (
        <div className="w-full h-full rounded-full bg-yellow-500 scale-50" />
      )}
    </div>
  );
}

function StepCard({ step }: { step: ProcessedStep }) {
  const isFuture = step.state === "future";
  const isNext = step.state === "next";
  // Only hide content for future/next steps that are not visible
  const isHidden = (isFuture || isNext) && !step.isVisible;

  return (
    <div
      className={clsx(
        "flex flex-col items-center text-center flex-1 min-w-0",
        isHidden && "opacity-60"
      )}
    >
      {/* Price */}
      <div
        className={clsx(
          "text-2xl md:text-3xl font-bold mb-1 transition-all",
          step.state === "completed" && "text-neutral-400 line-through",
          step.state === "current" && "text-green-400",
          isNext && !isHidden && "text-yellow-400",
          (isFuture || isHidden) && "text-neutral-500",
          isHidden && "blur-sm select-none"
        )}
      >
        {isHidden
          ? "€??"
          : step.price !== null
          ? formatPrice(step.price / 100)
          : "—"}
      </div>

      {/* Title */}
      <div
        className={clsx(
          "font-semibold text-sm md:text-base mb-0.5",
          step.state === "completed" && "text-neutral-400",
          step.state === "current" && "text-neutral-100",
          isNext && !isHidden && "text-yellow-200",
          (isFuture || isHidden) && "text-neutral-500",
          isHidden && "blur-[2px] select-none"
        )}
      >
        {isHidden ? "Coming Soon" : step.title}
      </div>

      {/* Status badge for next */}
      {isNext && !isHidden && (
        <div className="text-xs text-yellow-400 font-medium mb-1">Up Next</div>
      )}

      {/* Description */}
      {step.description && (
        <div
          className={clsx(
            "text-xs md:text-sm mb-1",
            step.state === "completed" && "text-neutral-500",
            step.state === "current" && "text-neutral-400",
            isNext && !isHidden && "text-neutral-400",
            (isFuture || isHidden) && "text-neutral-600",
            isHidden && "blur-[2px] select-none"
          )}
        >
          {isHidden ? "Details hidden" : step.description}
        </div>
      )}

      {/* Date */}
      <div
        className={clsx(
          "text-xs",
          step.state === "completed" && "text-neutral-500",
          step.state === "current" && "text-neutral-400",
          isNext && !isHidden && "text-neutral-400",
          (isFuture || isHidden) && "text-neutral-600",
          isHidden && "blur-[2px] select-none"
        )}
      >
        {isHidden ? (
          "Date hidden"
        ) : step.state === "completed" ? (
          step.availableUntil ? (
            `Ended ${formatDate(step.availableUntil)}`
          ) : (
            "Ended"
          )
        ) : step.state === "current" ? (
          step.availableUntil ? (
            `Until ${formatDate(step.availableUntil)}`
          ) : (
            "Available now"
          )
        ) : (isNext || isFuture) && step.availableFrom ? (
          `Starts ${formatDate(step.availableFrom)}`
        ) : null}
      </div>
    </div>
  );
}

function VerticalStep({
  step,
  isLast,
}: {
  step: ProcessedStep;
  isLast: boolean;
}) {
  const isFuture = step.state === "future";
  const isNext = step.state === "next";
  // Only hide content for future/next steps that are not visible
  const isHidden = (isFuture || isNext) && !step.isVisible;

  return (
    <div className={clsx("flex flex-col items-center", isHidden && "opacity-60")}>
      {/* Timeline */}
      <StepDot state={step.state} />

      {/* Content */}
      <div className="pb-6 text-center">
        {/* Price */}
        <div
          className={clsx(
            "text-2xl font-bold mb-1",
            step.state === "completed" && "text-neutral-400 line-through",
            step.state === "current" && "text-green-400",
            isNext && !isHidden && "text-yellow-400",
            (isFuture || isHidden) && "text-neutral-500",
            isHidden && "blur-sm select-none"
          )}
        >
          {isHidden
            ? "€??"
            : step.price !== null
            ? formatPrice(step.price / 100)
            : "—"}
        </div>

        {/* Title */}
        <div
          className={clsx(
            "font-semibold mb-0.5",
            step.state === "completed" && "text-neutral-400",
            step.state === "current" && "text-neutral-100",
            isNext && !isHidden && "text-yellow-200",
            (isFuture || isHidden) && "text-neutral-500",
            isHidden && "blur-[2px] select-none"
          )}
        >
          {isHidden ? "Coming Soon" : step.title}
        </div>

        {/* Status badge for next */}
        {isNext && !isHidden && (
          <div className="text-xs text-yellow-400 font-medium mb-1">
            Up Next
          </div>
        )}

        {/* Description */}
        {step.description && (
          <div
            className={clsx(
              "text-sm mb-1",
              step.state === "completed" && "text-neutral-500",
              step.state === "current" && "text-neutral-400",
              isNext && !isHidden && "text-neutral-400",
              (isFuture || isHidden) && "text-neutral-600",
              isHidden && "blur-[2px] select-none"
            )}
          >
            {isHidden ? "Details hidden" : step.description}
          </div>
        )}

        {/* Date */}
        <div
          className={clsx(
            "text-xs",
            step.state === "completed" && "text-neutral-500",
            step.state === "current" && "text-neutral-400",
            isNext && !isHidden && "text-neutral-400",
            (isFuture || isHidden) && "text-neutral-600",
            isHidden && "blur-[2px] select-none"
          )}
        >
          {isHidden ? (
            "Date hidden"
          ) : step.state === "completed" ? (
            step.availableUntil ? (
              `Ended ${formatDate(step.availableUntil)}`
            ) : (
              "Ended"
            )
          ) : step.state === "current" ? (
            step.availableUntil ? (
              `Until ${formatDate(step.availableUntil)}`
            ) : (
              "Available now"
            )
          ) : (isNext || isFuture) && step.availableFrom ? (
            `Starts ${formatDate(step.availableFrom)}`
          ) : null}
        </div>
      </div>

      {/* Connector line to next step */}
      {!isLast && (
        <div
          className={clsx(
            "w-0.5 h-8",
            step.state === "completed" ? "bg-neutral-500" : "bg-neutral-700"
          )}
        />
      )}
    </div>
  );
}

export default function TicketPriceProgressClient({
  heading,
  subheading,
  steps,
}: Props) {
  const [processedSteps, setProcessedSteps] = useState<ProcessedStep[]>([]);

  useEffect(() => {
    // Process steps on mount and set up interval for updates
    const updateSteps = () => {
      const now = new Date();
      setProcessedSteps(processSteps(steps, now));
    };

    updateSteps();

    // Update every minute to catch date changes
    const interval = setInterval(updateSteps, 60000);

    return () => clearInterval(interval);
  }, [steps]);

  if (steps.length === 0 || processedSteps.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4">
      {/* Header */}
      {(heading || subheading) && (
        <div className="text-center mb-8 md:mb-12">
          {heading && (
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-100 mb-2">
              {heading}
            </h2>
          )}
          {subheading && (
            <p className="text-neutral-400 text-sm md:text-base max-w-2xl mx-auto">
              {subheading}
            </p>
          )}
        </div>
      )}

      {/* Vertical layout for small screens */}
      <div className="sm:hidden flex flex-col items-center">
        {processedSteps.map((step, index) => (
          <VerticalStep
            key={index}
            step={step}
            isLast={index === processedSteps.length - 1}
          />
        ))}
      </div>

      {/* Horizontal layout for larger screens */}
      <div className="hidden sm:block">
        {/* Progress bar */}
        <div className="flex items-center mb-6">
          {processedSteps.map((step, index) => (
            <div
              key={index}
              className={clsx(
                "flex items-center",
                index < processedSteps.length - 1 && "flex-1"
              )}
            >
              <StepDot state={step.state} />
              {index < processedSteps.length - 1 && (
                <div
                  className={clsx(
                    "h-0.5 flex-1 mx-2",
                    step.state === "completed" ? "bg-neutral-500" : "bg-neutral-700"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step cards */}
        <div className="flex gap-4">
          {processedSteps.map((step, index) => (
            <StepCard key={index} step={step} />
          ))}
        </div>
      </div>
    </div>
  );
}
