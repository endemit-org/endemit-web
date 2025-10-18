import { fetchHomePageFromCms } from "@/domain/cms/actions";
import { notFound } from "next/navigation";
import { SliceZone } from "@prismicio/react";
import { components } from "../../../../components/prismicSlices";

export default async function Home() {
  const homePage = await fetchHomePageFromCms();

  if (!homePage) {
    notFound();
  }

  return <SliceZone slices={homePage.data.slices} components={components} />;
}
