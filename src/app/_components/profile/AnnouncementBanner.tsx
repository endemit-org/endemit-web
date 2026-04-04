"use client";

import clsx from "clsx";
import type { Announcement } from "@prisma/client";

interface AnnouncementBannerProps {
  announcement: Announcement;
  onDismiss: () => void;
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export default function AnnouncementBanner({
  announcement,
  onDismiss,
}: AnnouncementBannerProps) {
  const isWarning = announcement.type === "WARNING";

  return (
    <div
      className={clsx(
        "rounded-lg p-4 flex items-start gap-3",
        isWarning
          ? "bg-amber-950/50 border border-amber-700/50"
          : "bg-blue-950/50 border border-blue-700/50"
      )}
    >
      {isWarning ? (
        <WarningIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      ) : (
        <InfoIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
      )}

      <div className="flex-1 min-w-0">
        {announcement.title && (
          <h4
            className={clsx(
              "font-medium mb-1",
              isWarning ? "text-amber-200" : "text-blue-200"
            )}
          >
            {announcement.title}
          </h4>
        )}
        <p
          className={clsx(
            "text-sm",
            isWarning ? "text-amber-100/80" : "text-blue-100/80"
          )}
        >
          {announcement.message}
        </p>
      </div>

      <button
        onClick={onDismiss}
        className={clsx(
          "flex-shrink-0 p-1 rounded transition-colors",
          isWarning
            ? "text-amber-400 hover:text-amber-300 hover:bg-amber-900/50"
            : "text-blue-400 hover:text-blue-300 hover:bg-blue-900/50"
        )}
        aria-label="Dismiss announcement"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
