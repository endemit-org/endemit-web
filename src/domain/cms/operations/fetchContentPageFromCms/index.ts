import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformContentPageObject } from "@/domain/contentPage/transformers/transformContentPageObject";

export const fetchContentPageFromCms = async (pageUid: string) => {
  const prismicPage = await prismicClient
    .getByUID("content_page", pageUid)
    .catch(() => null);

  if (!prismicPage) {
    return null;
  }

  return transformContentPageObject(prismicPage);
};
