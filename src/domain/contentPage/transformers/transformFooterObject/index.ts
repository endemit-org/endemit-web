import { asLink, isFilled, type LinkField } from "@prismicio/client";
import { FooterContentDocument } from "@/prismicio-types";
import { Footer } from "@/domain/contentPage/types/footer";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { AppLocale } from "@/i18n/routing";

export const transformFooterObject = (
  footerContent: FooterContentDocument,
  locale: AppLocale = "sl"
) => {
  // `links` is language-specific (links_sl); fall back to base if unfilled.
  const linksSl = (footerContent.data as { links_sl?: LinkField[] }).links_sl;
  const links =
    locale === "sl" && linksSl?.some(l => isFilled.link(l))
      ? linksSl
      : footerContent.data.links;
  return {
    text: pickLocalized(footerContent.data, "footer_text", locale),
    links: links.map(link => ({
      label: (link as { text?: string }).text ?? "",
      link: asLink(link) || "",
    })),
    linkDividerSymbol: footerContent.data.link_divider_symbol,
  } as Footer;
};
