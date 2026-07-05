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
  locale,
  path,
}: {
  title?: string;
  description?: string;
  images?: { url: string; width?: number; height?: number }[];
  url?: string;
  type?: OpenGraphType;
  /** Current locale of the page — enables hreflang alternates when set. */
  locale?: "sl" | "en";
  /**
   * Locale-agnostic path (e.g. "/events/foo"). When provided together with
   * `locale`, canonical + hreflang alternates are generated for both locales.
   */
  path?: string;
}) => {
  const buildLanguageAlternates = () => {
    // path may be "" for the home page — only bail when it's absent entirely.
    if (path === undefined) return undefined;
    const slUrl = `${PUBLIC_BASE_WEB_URL}${path}`;
    const enUrl = `${PUBLIC_BASE_WEB_URL}/en${path}`;
    return {
      canonical: locale === "en" ? enUrl : slUrl,
      languages: {
        sl: slUrl,
        en: enUrl,
        "x-default": slUrl,
      },
    };
  };

  const alternates =
    buildLanguageAlternates() ?? (url ? { canonical: url } : undefined);
  const ogLocale = locale === "en" ? "en_US" : locale === "sl" ? "sl_SI" : undefined;

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      images,
      url: alternates?.canonical ?? url,
      type,
      locale: ogLocale,
    },
    twitter: {
      title,
      description,
      images: images?.map(img => img.url),
    },
  };
};
