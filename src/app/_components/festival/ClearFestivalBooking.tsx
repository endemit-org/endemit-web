"use client";

import { useEffect } from "react";
import { BOOKING_STORAGE_KEY } from "./booking";

/** The order is paid: forget the booking kept for this tab. */
export default function ClearFestivalBooking() {
  useEffect(() => {
    try {
      window.sessionStorage.removeItem(BOOKING_STORAGE_KEY);
    } catch {
      // Storage can be blocked; nothing to clear then.
    }
  }, []);
  return null;
}
