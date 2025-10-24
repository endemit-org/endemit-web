import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformNavigationMenuObject } from "@/domain/contentPage/transformers/transformNavigationMenuObject";

export const fetchNavigationMenuFromCms = async () => {
  const navigationMenu = await prismicClient
    .getSingle("menu_navigation")
    .catch(() => null);

  if (!navigationMenu) {
    return null;
  }

  return transformNavigationMenuObject(navigationMenu);
};
