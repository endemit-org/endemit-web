import { asLink } from "@prismicio/client";
import { FooterContentDocument } from "@/prismicio-types";
import { Footer } from "@/domain/contentPage/types/footer";

export const transformFooterObject = (footerContent: FooterContentDocument) => {
  return {
    text: footerContent.data.footer_text,
    links: footerContent.data.links.map(link => ({
      label: link.text,
      link: asLink(link) || "",
    })),
    linkDividerSymbol: footerContent.data.link_divider_symbol,
  } as Footer;
};
