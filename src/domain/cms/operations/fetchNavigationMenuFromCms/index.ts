import "server-only";

import { unstable_cache } from "next/cache";
import { prismicClient } from "@/lib/services/prismic";
import { transformNavigationMenuObject } from "@/domain/contentPage/transformers/transformNavigationMenuObject";

const fetchNavigationMenuFromCmsUncached = async () => {
  const navigationMenu = await prismicClient
    .getSingle("menu_navigation")
    .catch(() => null);

  if (!navigationMenu) {
    return null;
  }

  return transformNavigationMenuObject(navigationMenu);
};

// Cache navigation menu - rarely changes, revalidated by Prismic webhook
export const fetchNavigationMenuFromCms = unstable_cache(
  fetchNavigationMenuFromCmsUncached,
  ["navigation-menu"],
  {
    tags: ["prismic", "navigation"],
    revalidate: 3600, // 1 hour fallback, webhook handles immediate updates
  }
);
