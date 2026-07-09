"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "mobileMenuPromoDismissedAt";
const DISMISS_MS = 72 * 60 * 60 * 1000;

interface Props {
  /** When true, an X lets the user hide the promo for 72 hours. */
  dismissable: boolean;
  children: React.ReactNode;
}

/**
 * Client shell around the (server-rendered) mobile menu promo slices:
 * handles the dismiss X and the 72-hour localStorage snooze. Renders
 * nothing until the dismissal state is known, so there's no flash.
 */
export default function MobileMenuPromoFrame({ dismissable, children }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY));
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_MS) return;
    } catch {
      // Storage unavailable (private mode etc.) — just show the promo.
    }
    setVisible(true);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Can't persist — still hide it for this session.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative">
      {dismissable && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 hover:text-white hover:border-neutral-500 transition-colors"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 6l12 12M18 6L6 18"
            />
          </svg>
        </button>
      )}
      {children}
    </div>
  );
}
