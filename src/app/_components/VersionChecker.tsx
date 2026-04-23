"use client";

import { useVersionCheck } from "@/app/_hooks/useVersionCheck";

/**
 * Invisible component that checks for new app deployments and auto-refreshes.
 * Mount this in the root layout for global version detection.
 *
 * In local development (no NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID), this does nothing.
 * In production, it polls /api/v1/version every 5 minutes and on tab focus.
 */
export default function VersionChecker() {
  useVersionCheck();
  return null;
}
