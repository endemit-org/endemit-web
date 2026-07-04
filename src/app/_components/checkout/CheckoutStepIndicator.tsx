"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";

interface Step {
  number: number;
  label: string;
}

interface Props {
  currentStep: 1 | 2 | 3;
  steps?: Step[];
}

export default function CheckoutStepIndicator({
  currentStep,
  steps,
}: Props) {
  const t = useTranslations("checkout.steps");
  const resolvedSteps: Step[] = steps ?? [
    { number: 1, label: t("cart") },
    { number: 2, label: t("information") },
    { number: 3, label: t("reviewPay") },
  ];
  return (
    <div className="lg:hidden mb-6 w-full">
      <div className="flex items-start w-full">
        {resolvedSteps.map((step, index) => (
          <div key={step.number} className="flex-1 flex flex-col items-center relative">
            {/* Connector line (before circle, not on first step) */}
            {index > 0 && (
              <div
                className={clsx(
                  "absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2",
                  currentStep > step.number - 1
                    ? "bg-blue-600/30"
                    : "bg-neutral-700"
                )}
              />
            )}

            {/* Step circle */}
            <div
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors relative z-10",
                currentStep === step.number
                  ? "bg-blue-600 text-white"
                  : currentStep > step.number
                    ? "bg-blue-600/30 text-blue-400"
                    : "bg-neutral-700 text-neutral-400"
              )}
            >
              {currentStep > step.number ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                step.number
              )}
            </div>

            {/* Label */}
            <span
              className={clsx(
                "text-xs mt-1 text-center",
                currentStep === step.number
                  ? "text-neutral-200"
                  : currentStep > step.number
                    ? "text-neutral-400"
                    : "text-neutral-500"
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
