import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformInnerContentPageObject } from "@/domain/contentPage/transformers/transformInnerContentPageObject";
import type { AppLocale } from "@/i18n/routing";

const fetchInnerContentPagesFromCms = async ({
  pageSize = 200,
  locale = "sl",
}: {
  pageSize?: number;
  locale?: AppLocale;
}) => {
  const innerContentPages = await prismicClient.getAllByType("inner_content", {
    pageSize,
  });

  if (!innerContentPages) {
    return null;
  }

  return innerContentPages.map(innerContentPage =>
    transformInnerContentPageObject(innerContentPage, locale)
  );
};

export const fetchInnerContentPagesForEvent = async (
  eventId: string,
  locale: AppLocale = "sl"
) => {
  const innerContentPages = await fetchInnerContentPagesFromCms({ locale });

  if (!innerContentPages) {
    return null;
  }

  return innerContentPages.filter(
    innerContentPages => innerContentPages.connectedToEvent === eventId
  );
};

export const fetchInnerContentPagesForProduct = async (
  productId: string,
  locale: AppLocale = "sl"
) => {
  const innerContentPages = await fetchInnerContentPagesFromCms({ locale });

  if (!innerContentPages) {
    return null;
  }

  return innerContentPages.filter(
    innerContentPages => innerContentPages.connectedToProduct === productId
  );
};
