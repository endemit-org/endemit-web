import { ProductCategory } from "@/domain/product/types/product";

export const getTimeUntil = (currentTime: Date, date: Date) => {
  const diff = date.getTime() - currentTime.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 10) {
    return null;
  } else if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  } else {
    return `in ${minutes}m`;
  }
};

export const getSlugFromText = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
};

export const getCategoriesWithSlugs = Object.values(ProductCategory).map(
  category => ({
    name: category,
    slug: getSlugFromText(category),
  })
);

export const getCategoryFromSlug = (slug: string) => {
  const category = getCategoriesWithSlugs.find(cat => cat.slug === slug);
  return category ? category.name : null;
};

export const ensureTypeIsDate = (date: string | Date): Date => {
  return date instanceof Date ? date : new Date(date);
};

export const getStatusText = (status: string) => {
  return status.replace("_", " ").toLowerCase();
};

export const getResizedPrismicImage = (
  url: string,
  options?: {
    width?: number;
    quality?: number;
    format?: "png" | "webp";
    dpr?: 1 | 0;
  }
) => {
  return `${url}&&w=${options?.width ?? 500}&q=${options?.quality ?? 85}&fm=${options?.format ?? "webp"}&dpr=${options?.dpr ?? 1}`;
};

export const getBlurDataURL = async (imageUrl: string) => {
  const base64str = await fetch(
    getResizedPrismicImage(imageUrl, { width: 40, quality: 20, dpr: 0 })
  ).then(async res => Buffer.from(await res.arrayBuffer()).toString("base64"));

  const blurSvg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 5'>
      <filter id='b' color-interpolation-filters='sRGB'>
        <feGaussianBlur stdDeviation='1' />
      </filter>

      <image preserveAspectRatio='none' filter='url(#b)' x='0' y='0' height='100%' width='100%'
      href='data:image/avif;base64,${base64str}' />
    </svg>
  `;

  const toBase64 = (str: string) =>
    typeof window === "undefined"
      ? Buffer.from(str).toString("base64")
      : window.btoa(str);

  return `data:image/svg+xml;base64,${toBase64(blurSvg)}`;
};
