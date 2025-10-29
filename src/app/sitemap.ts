import type { MetadataRoute } from "next";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { fetchContentPagesFromCms } from "@/domain/cms/operations/fetchContentPagesFromCms";
import { fetchHomePageFromCms } from "@/domain/cms/operations/fetchHomePageFromCms";
import { fetchArtistsFromCms } from "@/domain/cms/operations/fetchArtistsFromCms";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { fetchVenuesFromCms } from "@/domain/cms/operations/fetchVenuesFromCms";
import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import { getProductLink } from "@/domain/product/actions/getProductLink";
import { fetchPodcastsFromCms } from "@/domain/cms/operations/fetchPodcastsFromCms";
import { transformPageToSitemapEntries } from "@/lib/util/sitemap";
import { getCategoriesWithSlugs } from "@/lib/util/util";

const baseUrl = PUBLIC_BASE_WEB_URL;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    homePageItem,
    contentPageItems,
    eventPageItems,
    artistPageItems,
    venuePageItems,
    productPageItems,
    podcastPageItems,
  ] = await Promise.all([
    fetchHomePageFromCms(),
    fetchContentPagesFromCms({}),
    fetchEventsFromCms({}),
    fetchArtistsFromCms({}),
    fetchVenuesFromCms({}),
    fetchProductsFromCms({}),
    fetchPodcastsFromCms({}),
  ]);

  const categoryItems = getCategoriesWithSlugs.map(category => ({
    ...category,
    updatedAt: new Date(),
  }));

  const homePage = homePageItem
    ? [
        {
          url: baseUrl,
          lastModified: new Date(homePageItem.last_publication_date),
          changeFrequency: "daily" as const,
          priority: 1,
        },
      ]
    : [];

  const contentPages =
    contentPageItems?.map(page => ({
      url: `${baseUrl}/${page.uid}`,
      lastModified: page.updatedAt,
      changeFrequency: page.meta.frequency ?? ("weekly" as const),
      priority: page.meta.priority ?? 0.8,
    })) ?? [];

  const eventPages = transformPageToSitemapEntries(eventPageItems, {
    getUrl: item => `${baseUrl}/events/${item.uid}`,
    changeFrequency: "monthly",
    priority: 1,
    getImages: item => [
      item.promoImage?.src,
      item.coverImage?.src,
      ...item.artists.map(artist => artist.image?.src),
    ],
  });

  const artistPages = transformPageToSitemapEntries(artistPageItems, {
    getUrl: item => `${baseUrl}/artists/${item.uid}`,
    changeFrequency: "monthly",
    priority: 0.8,
    getImages: item => [item.image?.src],
  });

  const venuePages = transformPageToSitemapEntries(venuePageItems, {
    getUrl: item => `${baseUrl}/venues/${item.uid}`,
    changeFrequency: "monthly",
    priority: 0.5,
    getImages: item => [item.image?.src],
  });

  const productPages = transformPageToSitemapEntries(productPageItems, {
    getUrl: item => getProductLink(item.uid, item.category, true),
    changeFrequency: "weekly",
    priority: 1,
    getImages: item => item.images.map(image => image.src),
  });

  const podcastPages = transformPageToSitemapEntries(podcastPageItems, {
    getUrl: item => `${baseUrl}/music/emit/${item.uid}`,
    changeFrequency: "monthly",
    priority: 0.9,
    getImages: item => [item.cover?.src],
  });

  const categoryPages = transformPageToSitemapEntries(categoryItems, {
    getUrl: item => `${baseUrl}/store/${item.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  });

  return [
    ...homePage,
    ...contentPages,
    ...eventPages,
    ...artistPages,
    ...productPages,
    ...venuePages,
    ...podcastPages,
    ...categoryPages,
  ];
}
