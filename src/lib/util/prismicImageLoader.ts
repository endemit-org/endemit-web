import type { ImageLoader } from "next/image";

const isPrismicUrl = (src: string): boolean =>
  src.includes("images.prismic.io") || src.includes(".cdn.prismic.io");

export const prismicImageLoader: ImageLoader = ({ src, width, quality }) => {
  if (!isPrismicUrl(src)) {
    return src;
  }
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 80));
  url.searchParams.set("fm", "webp");
  url.searchParams.set("dpr", "1");
  return url.toString();
};
