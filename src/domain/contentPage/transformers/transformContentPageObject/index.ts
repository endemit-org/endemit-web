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
    updatedAt: new Date(contentPage.last_publication_date),
    meta: {
      title: contentPage.data.meta_title,
      description: contentPage.data.meta_description,
      image: contentPage.data.meta_image?.url || null,
      priority: contentPage.data.priority,
      frequency: contentPage.data.update_frequency,
    },
  } as ContentPage;
};
