import { MenuItem } from "@/domain/contentPage/types/menuItem";
import { asLink, isFilled, type LinkField } from "@prismicio/client";
import { MenuNavigationDocument } from "@/prismicio-types";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { AppLocale } from "@/i18n/routing";

export const transformNavigationMenuObject = (
  navigationMenu: MenuNavigationDocument,
  locale: AppLocale = "sl"
) => {
  return {
    items: navigationMenu.data.items.map(item => {
      // `link` is language-specific (link_sl); fall back to base if unfilled.
      const linkSl = (item as { link_sl?: LinkField }).link_sl;
      const link =
        locale === "sl" && linkSl && isFilled.link(linkSl) ? linkSl : item.link;
      return {
        linkType: (link as { variant?: string }).variant ?? item.link.variant,
        label: (link as { text?: string }).text ?? item.link.text,
        link: asLink(link) || "",
        ctaText: pickLocalized(item, "cta_text", locale) ?? undefined,
      };
    }) as MenuItem[],
  };
};
