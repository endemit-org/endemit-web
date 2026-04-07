import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformInnerContentPageObject } from "@/domain/contentPage/transformers/transformInnerContentPageObject";

export const fetchInnerContentFromCms = async (uid: string) => {
  const innerContent = await prismicClient
    .getByUID("inner_content", uid)
    .catch(() => null);

  if (!innerContent) {
    return null;
  }

  return transformInnerContentPageObject(innerContent);
};
