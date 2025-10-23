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
