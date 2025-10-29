import type { MetadataRoute } from "next";

export type SitemapConfig<T> = {
  getUrl: (item: T) => string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  getImages?: (item: T) => (string | undefined)[];
};

export const transformPageToSitemapEntries = <T extends { updatedAt: Date }>(
  items: T[] | null,
  config: SitemapConfig<T>
): MetadataRoute.Sitemap => {
  if (!items) return [];
  return items.map(item => {
    const images = config
      .getImages?.(item)
      .filter((img): img is string => !!img);
    return {
      url: config.getUrl(item),
      lastModified: item.updatedAt,
      changeFrequency: config.changeFrequency,
      priority: config.priority,
      ...(images?.length && { images }),
    };
  });
};
