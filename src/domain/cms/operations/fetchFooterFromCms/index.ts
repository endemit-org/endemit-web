import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformFooterObject } from "@/domain/contentPage/transformers/transformFooterObject";
import type { AppLocale } from "@/i18n/routing";

export const fetchFooterFromCms = async (locale: AppLocale = "sl") => {
  const footer = await prismicClient
    .getSingle("footer_content")
    .catch(() => null);

  if (!footer) {
    return null;
  }

  return transformFooterObject(footer, locale);
};
