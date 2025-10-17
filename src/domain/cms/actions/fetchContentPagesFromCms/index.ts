import { prismicClient } from "@/services/prismic";
import { PrismicContentPageDocument } from "@/domain/cms/types/prismic";
import { getFormattedContentPage } from "@/domain/contentPage/actions";

export const fetchContentPagesFromCms = async ({
  pageSize = 200,
  filters,
}: {
  pageSize?: number;
  filters?: string[];
}) => {
  const contentPages = (await prismicClient.getAllByType("content_page", {
    pageSize,
    ...(filters && { filters }),
  })) as PrismicContentPageDocument[];

  if (!contentPages) {
    return null;
  }

  const contentPagesWithLocalType = contentPages.map(contentPage =>
    getFormattedContentPage(contentPage)
  );

  return contentPagesWithLocalType;
};
