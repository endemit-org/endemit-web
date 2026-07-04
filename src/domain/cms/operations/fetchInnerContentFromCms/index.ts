import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformInnerContentPageObject } from "@/domain/contentPage/transformers/transformInnerContentPageObject";
import type { AppLocale } from "@/i18n/routing";

export const fetchInnerContentFromCms = async (
  uid: string,
  locale: AppLocale = "sl"
) => {
  const innerContent = await prismicClient
    .getByUID("inner_content", uid)
    .catch(() => null);

  if (!innerContent) {
    return null;
  }

  return transformInnerContentPageObject(innerContent, locale);
};
