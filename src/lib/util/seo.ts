import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { getResizedPrismicImage } from "@/lib/util/util";

type OpenGraphImageInput = {
  metaImage?: string | null;
  fallbackImages?: string[] | null;
  width?: number;
};

const defaultOgImage = `${PUBLIC_BASE_WEB_URL}/images/og/endemit-og.png`;

export const getDefaultOgImage = () => defaultOgImage;

export function buildOpenGraphImages({
  metaImage,
  fallbackImages,
  width = 1200,
}: OpenGraphImageInput) {
  if (metaImage) {
    return [{ url: getResizedPrismicImage(metaImage, { width }) }];
  }

  if (fallbackImages?.length) {
    return fallbackImages.map(img => ({
      url: getResizedPrismicImage(img, { width }),
    }));
  }

  return [{ url: getDefaultOgImage() }];
}
