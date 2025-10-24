import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformFooterObject } from "@/domain/contentPage/transformers/transformFooterObject";

export const fetchFooterFromCms = async () => {
  const footer = await prismicClient
    .getSingle("footer_content")
    .catch(() => null);

  if (!footer) {
    return null;
  }

  return transformFooterObject(footer);
};
