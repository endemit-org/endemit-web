import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformContentPageObject } from "@/domain/contentPage/transformers/transformContentPageObject";
import type { AppLocale } from "@/i18n/routing";

export const fetchContentPageFromCms = async (
  pageUid: string,
  locale: AppLocale = "sl"
) => {
  const prismicPage = await prismicClient
    .getByUID("content_page", pageUid)
    .catch(() => null);

  if (!prismicPage) {
    return null;
  }

  return await transformContentPageObject(prismicPage, locale);
};
