"use client";

import { useOnlineStatus } from "@/app/_hooks/useOnlineStatus";

/**
 * Toast notification that appears when the user goes offline.
 * Automatically hides when connection is restored.
 *
 * Mount this in the root layout for global offline detection.
 */
export default function OfflineToast() {
  const { isOffline } = useOnlineStatus();

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]
                 flex items-center gap-3 px-4 py-3
                 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl
                 animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      {/* Offline icon */}
      <div className="flex-shrink-0">
        <svg
          className="w-5 h-5 text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-7.072 0l2.829-2.829M3 3l3.536 3.536"
          />
        </svg>
      </div>

      {/* Message */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-neutral-200">
          You&apos;re offline
        </span>
        <span className="text-xs text-neutral-400">
          Some features may be unavailable
        </span>
      </div>

      {/* Pulsing indicator */}
      <div className="flex-shrink-0 ml-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      </div>
    </div>
  );
}
