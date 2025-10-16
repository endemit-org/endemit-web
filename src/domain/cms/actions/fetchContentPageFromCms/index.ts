import { prismicClient } from "@/app/services/prismic";
import { PrismicContentPageDocument } from "@/types/prismic";
import { getFormattedContentPage } from "@/domain/contentPage/actions";

export const fetchContentPageFromCms = async (pageId: string) => {
  const prismicPage = (await prismicClient
    .getByUID("content_page", pageId)
    .catch(() => null)) as PrismicContentPageDocument;

  const contentPageWithLocalType = getFormattedContentPage(prismicPage);

  return contentPageWithLocalType;
};
