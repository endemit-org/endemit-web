import { PrismicContentPageDocument } from "@/domain/cms/types/prismic";
import { ContentPage } from "@/domain/contentPage/types/contentPage";

export const getFormattedContentPage = (
  contentPage: PrismicContentPageDocument
) => {
  return {
    id: contentPage.id,
    uid: contentPage.uid,
    title: contentPage.data.title,
    renderFrame: contentPage.data.render_frame ?? false,
    slices: contentPage.data.slices,
    meta: {
      title: contentPage.data.meta_title,
      description: contentPage.data.meta_description,
      image: contentPage.data.meta_image?.url || null,
    },
  } as ContentPage;
};
