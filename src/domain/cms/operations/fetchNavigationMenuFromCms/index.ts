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

// Cache navigation menu per deployment - fresh on each deploy
// Also responds to Prismic webhook revalidation
const deploymentId = process.env.VERCEL_DEPLOYMENT_ID || "local";

export const fetchNavigationMenuFromCms = unstable_cache(
  fetchNavigationMenuFromCmsUncached,
  ["navigation-menu", deploymentId],
  {
    tags: ["prismic", "navigation"],
  }
);
