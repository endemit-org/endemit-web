"use client";

import { useLocale } from "next-intl";
import { useHasMounted } from "@/app/_hooks/useHasMounted";
import {
  formatDateTime,
  formatDate,
  formatTime,
} from "@/lib/util/formatting";

type FormatType = "datetime" | "date" | "time" | "custom";

interface ClientDateProps {
  date: Date | string | null | undefined;
  format?: FormatType;
  customFormatter?: (date: Date) => string;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Renders a formatted date only on the client to avoid hydration mismatches.
 * Server renders the fallback (or empty), client renders the formatted date.
 */
export default function ClientDate({
  date,
  format = "datetime",
  customFormatter,
  fallback = null,
  className,
}: ClientDateProps) {
  const hasMounted = useHasMounted();
  const locale = useLocale() as "sl" | "en";

  if (!date) {
    return <span className={className}>{fallback}</span>;
  }

  if (!hasMounted) {
    return <span className={className}>{fallback}</span>;
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;

  let formatted: string;
  if (customFormatter) {
    formatted = customFormatter(dateObj);
  } else {
    switch (format) {
      case "date":
        formatted = formatDate(dateObj, locale);
        break;
      case "time":
        formatted = formatTime(dateObj);
        break;
      case "datetime":
      default:
        formatted = formatDateTime(dateObj, locale);
        break;
    }
  }

  return <span className={className}>{formatted}</span>;
}
