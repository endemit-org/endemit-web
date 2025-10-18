import { prismicClient } from "@/services/prismic";
import { getFormattedNavigationMenu } from "@/domain/contentPage/actions";

export const fetchNavigationMenuFromCms = async () => {
  const navigationMenu = await prismicClient
    .getSingle("menu_navigation")
    .catch(() => null);

  if (!navigationMenu) {
    return null;
  }

  const navigationMenuWithLocalType =
    getFormattedNavigationMenu(navigationMenu);

  return navigationMenuWithLocalType;
};
