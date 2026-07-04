import { InnerContentDocument } from "@/prismicio-types";
import { InnerContentPage } from "@/domain/contentPage/types/innerContentPage";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { AppLocale } from "@/i18n/routing";

export const transformInnerContentPageObject = (
  contentPage: InnerContentDocument,
  locale: AppLocale = "sl"
) => {
  return {
    id: contentPage.id,
    uid: contentPage.uid,
    title: pickLocalized(contentPage.data, "title", locale),
    sortingWeight: contentPage.data.sorting_weight,
    slices: contentPage.data.slices,
    connectedToEvent: contentPage.data.connected_to_event
      ? // @ts-expect-error ID does exist on the connected_to_event field
        contentPage.data.connected_to_event.id
      : null,
    connectedToProduct: contentPage.data.related_to_product
      ? // @ts-expect-error ID does exist on the related_to_product field
        contentPage.data.related_to_product.id
      : null,
  } as InnerContentPage;
};
