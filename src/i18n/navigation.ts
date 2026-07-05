import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware replacements for next/link, next/navigation helpers.
// Use these in all public (localized) pages and components.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
