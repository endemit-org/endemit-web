import { ContentPage } from "@/domain/contentPage/types/contentPage";
import { ContentPageDocument } from "@/prismicio-types";

export const transformContentPageObject = (
  contentPage: ContentPageDocument
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
