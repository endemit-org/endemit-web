import { MenuItem } from "@/domain/contentPage/types/MenuItem";
import { asLink } from "@prismicio/client";
import { MenuNavigationDocument } from "@/prismicio-types";

export const getFormattedNavigationMenu = (
  navigationMenu: MenuNavigationDocument
) => {
  return {
    items: navigationMenu.data.items.map(item => ({
      linkType: item.link.variant,
      label: item.link.text,
      link: asLink(item.link) || "",
    })) as MenuItem[],
  };
};
