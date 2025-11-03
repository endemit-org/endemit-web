import { fetchHomePageFromCms } from "@/domain/cms/operations/fetchHomePageFromCms";
import { notFound } from "next/navigation";
import SliceDisplay from "@/app/_components/content/SliceDisplay";
import { Metadata } from "next";
import React from "react";
import { buildOpenGraphImages, buildOpenGraphObject } from "@/lib/util/seo";

export async function generateMetadata(): Promise<Metadata> {
  const homePage = await fetchHomePageFromCms();

  const title = homePage?.data.meta_title ?? undefined;
  const description = homePage?.data.meta_description ?? undefined;

  const images = buildOpenGraphImages({
    metaImage: homePage?.data.meta_image.url,
  });

  return buildOpenGraphObject({ title, description, images });
}

export default async function Home() {
  const homePage = await fetchHomePageFromCms();

  if (!homePage) {
    notFound();
  }

  return (
    <>
      <SliceDisplay slices={homePage.data.slices} />
    </>
  );
}
