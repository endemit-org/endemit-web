import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformInnerContentPageObject } from "@/domain/contentPage/transformers/transformInnerContentPageObject";

const fetchInnerContentPagesFromCms = async ({
  pageSize = 200,
}: {
  pageSize?: number;
}) => {
  const innerContentPages = await prismicClient.getAllByType("inner_content", {
    pageSize,
  });

  if (!innerContentPages) {
    return null;
  }

  return innerContentPages.map(innerContentPage =>
    transformInnerContentPageObject(innerContentPage)
  );
};

export const fetchInnerContentPagesForEvent = async (eventId: string) => {
  const innerContentPages = await fetchInnerContentPagesFromCms({});

  if (!innerContentPages) {
    return null;
  }

  return innerContentPages.filter(
    innerContentPages => innerContentPages.connectedToEvent === eventId
  );
};

export const fetchInnerContentPagesForProduct = async (productId: string) => {
  const innerContentPages = await fetchInnerContentPagesFromCms({});

  if (!innerContentPages) {
    return null;
  }

  return innerContentPages.filter(
    innerContentPages => innerContentPages.connectedToProduct === productId
  );
};
