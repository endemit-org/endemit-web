"use client";

import { formatPrice } from "@/lib/util/formatting";
import clsx from "clsx";

export interface PriceStep {
  title: string;
  description: string | null;
  price: number | null; // null for future steps (hidden)
  availableUntil: string | null;
  state: "completed" | "current" | "future";
}

interface Props {
  heading: string | null;
  subheading: string | null;
  steps: PriceStep[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function StepDot({ state }: { state: PriceStep["state"] }) {
  return (
    <div
      className={clsx(
        "w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all",
        state === "completed" &&
          "bg-green-500 border-green-500",
        state === "current" &&
          "bg-white border-green-500 ring-4 ring-green-500/20",
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
    </div>
  );
}

function StepCard({ step }: { step: PriceStep }) {
  const isFuture = step.state === "future";

  return (
    <div className="flex flex-col items-center text-center flex-1 min-w-0">
      {/* Price */}
      <div
        className={clsx(
          "text-2xl md:text-3xl font-bold mb-1 transition-all",
          step.state === "completed" && "text-neutral-400",
          step.state === "current" && "text-green-400",
          isFuture && "text-neutral-500 blur-sm select-none"
        )}
      >
        {isFuture ? "€??" : step.price !== null ? formatPrice(step.price / 100) : "—"}
      </div>

      {/* Title */}
      <div
        className={clsx(
          "font-semibold text-sm md:text-base mb-0.5",
          step.state === "completed" && "text-neutral-400",
          step.state === "current" && "text-neutral-100",
          isFuture && "text-neutral-500 blur-[2px] select-none"
        )}
      >
        {isFuture ? "Coming Soon" : step.title}
      </div>

      {/* Description */}
      {step.description && (
        <div
          className={clsx(
            "text-xs md:text-sm mb-1",
            step.state === "completed" && "text-neutral-500",
            step.state === "current" && "text-neutral-400",
            isFuture && "text-neutral-600 blur-[2px] select-none"
          )}
        >
          {isFuture ? "Details hidden" : step.description}
        </div>
      )}

      {/* Date */}
      {step.availableUntil && (
        <div
          className={clsx(
            "text-xs",
            step.state === "completed" && "text-neutral-500",
            step.state === "current" && "text-neutral-400",
            isFuture && "text-neutral-600 blur-[2px] select-none"
          )}
        >
          {step.state === "completed"
            ? `Ended ${formatDate(step.availableUntil)}`
            : step.state === "current"
            ? `Until ${formatDate(step.availableUntil)}`
            : "Date hidden"}
        </div>
      )}
    </div>
  );
}

function VerticalStep({
  step,
  isLast,
}: {
  step: PriceStep;
  isLast: boolean;
}) {
  const isFuture = step.state === "future";

  return (
    <div className="flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <StepDot state={step.state} />
        {!isLast && (
          <div
            className={clsx(
              "w-0.5 flex-1 min-h-[60px]",
              step.state === "completed" ? "bg-green-500" : "bg-neutral-700"
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className="pb-6 flex-1">
        {/* Price */}
        <div
          className={clsx(
            "text-2xl font-bold mb-1",
            step.state === "completed" && "text-neutral-400",
            step.state === "current" && "text-green-400",
            isFuture && "text-neutral-500 blur-sm select-none"
          )}
        >
          {isFuture ? "€??" : step.price !== null ? formatPrice(step.price / 100) : "—"}
        </div>

        {/* Title */}
        <div
          className={clsx(
            "font-semibold mb-0.5",
            step.state === "completed" && "text-neutral-400",
            step.state === "current" && "text-neutral-100",
            isFuture && "text-neutral-500 blur-[2px] select-none"
          )}
        >
          {isFuture ? "Coming Soon" : step.title}
        </div>

        {/* Description */}
        {step.description && (
          <div
            className={clsx(
              "text-sm mb-1",
              step.state === "completed" && "text-neutral-500",
              step.state === "current" && "text-neutral-400",
              isFuture && "text-neutral-600 blur-[2px] select-none"
            )}
          >
            {isFuture ? "Details hidden" : step.description}
          </div>
        )}

        {/* Date */}
        {step.availableUntil && (
          <div
            className={clsx(
              "text-xs",
              step.state === "completed" && "text-neutral-500",
              step.state === "current" && "text-neutral-400",
              isFuture && "text-neutral-600 blur-[2px] select-none"
            )}
          >
            {step.state === "completed"
              ? `Ended ${formatDate(step.availableUntil)}`
              : step.state === "current"
              ? `Until ${formatDate(step.availableUntil)}`
              : "Date hidden"}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TicketPriceProgressClient({
  heading,
  subheading,
  steps,
}: Props) {
  if (steps.length === 0) {
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
      <div className="sm:hidden">
        {steps.map((step, index) => (
          <VerticalStep
            key={index}
            step={step}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>

      {/* Horizontal layout for larger screens */}
      <div className="hidden sm:block">
        {/* Progress bar */}
        <div className="flex items-center mb-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={clsx(
                "flex items-center",
                index < steps.length - 1 && "flex-1"
              )}
            >
              <StepDot state={step.state} />
              {index < steps.length - 1 && (
                <div
                  className={clsx(
                    "h-0.5 flex-1 mx-2",
                    step.state === "completed" ? "bg-green-500" : "bg-neutral-700"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step cards */}
        <div className="flex gap-4">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} />
          ))}
        </div>
      </div>
    </div>
  );
}
