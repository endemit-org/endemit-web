import { ContentPage } from "@/domain/contentPage/types/contentPage";
import { ContentPageDocument } from "@/prismicio-types";
import { getBlurDataURL } from "@/lib/util/util";

export const transformContentPageObject = async (
  contentPage: ContentPageDocument
): Promise<ContentPage> => {
  const backgroundImageUrl = contentPage.data.background_image?.url;

  return {
    id: contentPage.id,
    uid: contentPage.uid,
    title: contentPage.data.title ?? "",
    renderFrame: contentPage.data.render_frame ?? false,
    backgroundImage: backgroundImageUrl
      ? {
          src: backgroundImageUrl,
          alt: contentPage.data.background_image?.alt ?? null,
          placeholder: await getBlurDataURL(backgroundImageUrl),
        }
      : null,
    backgroundAnimated: contentPage.data.background_animated ?? true,
    slices: contentPage.data.slices,
    updatedAt: new Date(contentPage.last_publication_date),
    meta: {
      title: contentPage.data.meta_title,
      description: contentPage.data.meta_description,
      image: contentPage.data.meta_image?.url || null,
      priority: contentPage.data.priority ?? undefined,
      frequency: contentPage.data.update_frequency ?? undefined,
    },
  };
};
