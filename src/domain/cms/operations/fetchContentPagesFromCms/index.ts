import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformContentPageObject } from "@/domain/contentPage/transformers/transformContentPageObject";

export const fetchContentPagesFromCms = async ({
  pageSize = 200,
  filters,
}: {
  pageSize?: number;
  filters?: string[];
}) => {
  const contentPages = await prismicClient.getAllByType("content_page", {
    pageSize,
    ...(filters && { filters }),
  });

  if (!contentPages) {
    return null;
  }

  return contentPages.map(contentPage =>
    transformContentPageObject(contentPage)
  );
};
