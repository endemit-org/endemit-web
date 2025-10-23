import { InnerContentDocument } from "@/prismicio-types";
import { InnerContentPage } from "@/domain/contentPage/types/innerContentPage";

export const transformInnerContentPageObject = (
  contentPage: InnerContentDocument
) => {
  return {
    id: contentPage.id,
    uid: contentPage.uid,
    title: contentPage.data.title,
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
