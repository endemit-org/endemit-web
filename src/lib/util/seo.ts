import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { getResizedPrismicImage } from "@/lib/util/util";

type OpenGraphImageInput = {
  metaImage?: string | null;
  fallbackImages?: string[] | null;
  width?: number;
  height?: number;
  quality?: number;
};

type OpenGraphType =
  | "website"
  | "article"
  | "music.song"
  | "music.album"
  | "music.playlist"
  | "music.radio_station"
  | "video.movie"
  | "video.episode"
  | "video.tv_show"
  | "video.other"
  | "book"
  | "profile";

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

const defaultOgImage = `${PUBLIC_BASE_WEB_URL}/images/og/endemit-og.png`;

export const getDefaultOgImage = () => defaultOgImage;

export const buildOpenGraphImages = ({
  metaImage,
  fallbackImages,
  width = OG_IMAGE_WIDTH,
  height = OG_IMAGE_HEIGHT,
  quality = 70,
}: OpenGraphImageInput) => {
  if (metaImage) {
    return [
      { url: getResizedPrismicImage(metaImage, { width, quality }), width, height },
    ];
  }

  if (fallbackImages?.length) {
    return fallbackImages.map(img => ({
      url: getResizedPrismicImage(img, { width, quality }),
      width,
      height,
    }));
  }

  return [{ url: getDefaultOgImage(), width, height }];
};

export const buildOpenGraphObject = ({
  title,
  description,
  images,
  url,
  type = "website",
}: {
  title?: string;
  description?: string;
  images?: { url: string; width?: number; height?: number }[];
  url?: string;
  type?: OpenGraphType;
}) => {
  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title,
      description,
      images,
      url,
      type,
    },
    twitter: {
      title,
      description,
      images: images?.map(img => img.url),
    },
  };
};
