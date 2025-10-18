import { prismicClient } from "@/services/prismic";

export const fetchHomePageFromCms = async () => {
  const homePage = await prismicClient
    .getSingle("home_page", {
      fetchOptions: { next: { revalidate: 0 } },
    })
    .catch(() => null);

  if (!homePage) {
    return null;
  }

  return homePage;
};
