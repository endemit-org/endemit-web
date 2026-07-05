import "server-only";

import { unstable_cache } from "next/cache";
import { prismicClient } from "@/lib/services/prismic";
import { transformNavigationMenuObject } from "@/domain/contentPage/transformers/transformNavigationMenuObject";
import type { AppLocale } from "@/i18n/routing";

const fetchNavigationMenuFromCmsUncached = async (locale: AppLocale) => {
  const navigationMenu = await prismicClient
    .getSingle("menu_navigation")
    .catch(() => null);

  if (!navigationMenu) {
    return null;
  }

  return transformNavigationMenuObject(navigationMenu, locale);
};

// Cache navigation menu per deployment - fresh on each deploy
// Also responds to Prismic webhook revalidation. The `locale` argument is part
// of the unstable_cache key, so sl/en are cached separately.
const deploymentId = process.env.VERCEL_DEPLOYMENT_ID || "local";

const cachedNavigationMenu = unstable_cache(
  fetchNavigationMenuFromCmsUncached,
  ["navigation-menu", deploymentId],
  {
    tags: ["prismic", "navigation"],
  }
);

export const fetchNavigationMenuFromCms = (locale: AppLocale = "sl") =>
  cachedNavigationMenu(locale);
