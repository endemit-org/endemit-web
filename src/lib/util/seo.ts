import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { getResizedPrismicImage } from "@/lib/util/util";

type OpenGraphImageInput = {
  metaImage?: string | null;
  fallbackImages?: string[] | null;
  width?: number;
};

const defaultOgImage = `${PUBLIC_BASE_WEB_URL}/images/og/endemit-og.png`;

export const getDefaultOgImage = () => defaultOgImage;

export const buildOpenGraphImages = ({
  metaImage,
  fallbackImages,
  width = 1200,
}: OpenGraphImageInput) => {
  if (metaImage) {
    return [{ url: getResizedPrismicImage(metaImage, { width }) }];
  }

  if (fallbackImages?.length) {
    return fallbackImages.map(img => ({
      url: getResizedPrismicImage(img, { width }),
    }));
  }

  return [{ url: getDefaultOgImage() }];
};

export const buildOpenGraphObject = ({
  title,
  description,
  images,
}: {
  title?: string;
  description?: string;
  images?: { url: string }[];
}) => {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
    },
    twitter: {
      title,
      description,
      images,
    },
  };
};
