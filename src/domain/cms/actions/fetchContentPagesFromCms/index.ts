import { prismicClient } from "@/app/services/prismic";
import { PrismicContentPageDocument } from "@/types/prismic";
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

  const contentPagesWithLocalType = contentPages.map(contentPage =>
    getFormattedContentPage(contentPage)
  );

  return contentPagesWithLocalType;
};
