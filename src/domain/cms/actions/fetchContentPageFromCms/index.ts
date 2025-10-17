import { prismicClient } from "@/services/prismic";
import { PrismicContentPageDocument } from "@/domain/cms/types/prismic";
import { getFormattedContentPage } from "@/domain/contentPage/actions";

export const fetchContentPageFromCms = async (pageUid: string) => {
  const prismicPage = (await prismicClient
    .getByUID("content_page", pageUid)
    .catch(() => null)) as PrismicContentPageDocument;

  if (!prismicPage) {
    return null;
  }

  const contentPageWithLocalType = getFormattedContentPage(prismicPage);

  return contentPageWithLocalType;
};
