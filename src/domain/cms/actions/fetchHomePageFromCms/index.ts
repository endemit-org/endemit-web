import { prismicClient } from "@/services/prismic";

export const fetchHomePageFromCms = async () => {
  const homePage = await prismicClient.getSingle("home_page").catch(() => null);

  if (!homePage) {
    return null;
  }

  return homePage;
};
