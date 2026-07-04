import { ContentPage } from "@/domain/contentPage/types/contentPage";
import { ContentPageDocument } from "@/prismicio-types";
import { getBlurDataURL } from "@/lib/util/util";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { AppLocale } from "@/i18n/routing";

export const transformContentPageObject = async (
  contentPage: ContentPageDocument,
  locale: AppLocale = "sl"
): Promise<ContentPage> => {
  const backgroundImageUrl = contentPage.data.background_image?.url;

  return {
    id: contentPage.id,
    uid: contentPage.uid,
    title: pickLocalized(contentPage.data, "title", locale) ?? "",
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
      title: pickLocalized(contentPage.data, "meta_title", locale),
      description: pickLocalized(contentPage.data, "meta_description", locale),
      image: contentPage.data.meta_image?.url || null,
      priority: contentPage.data.priority ?? undefined,
      frequency: contentPage.data.update_frequency ?? undefined,
    },
  };
};
