import { fetchContentPagesFromCms } from "@/domain/cms/operations/fetchContentPagesFromCms";
import { fetchContentPageFromCms } from "@/domain/cms/operations/fetchContentPageFromCms";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import OuterPage from "@/app/_components/ui/OuterPage";
import InnerPage from "@/app/_components/ui/InnerPage";
import { notFound } from "next/navigation";
import SliceDisplay from "@/app/_components/content/SliceDisplay";
import { Metadata } from "next";
import { buildOpenGraphImages } from "@/lib/util/seo";

export async function generateStaticParams() {
  const contentPages = await fetchContentPagesFromCms({});

  if (!contentPages || contentPages.length === 0) {
    return [];
  }

  return contentPages.map(contentPage => ({
    uid: contentPage.uid,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    uid: string;
  }>;
}): Promise<Metadata> {
  const { uid } = await params;
  const contentPage = await fetchContentPageFromCms(uid);

  if (!contentPage) {
    notFound();
  }

  const title = contentPage.meta.title ?? contentPage.title;
  const description = contentPage?.meta.description ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: buildOpenGraphImages({
        metaImage: contentPage.meta.image,
      }),
    },
  };
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{
    uid: string;
  }>;
}) {
  const { uid } = await params;
  const contentPage = await fetchContentPageFromCms(uid);

  if (!contentPage) {
    notFound();
  }

  return (
    <OuterPage>
      <PageHeadline
        title={contentPage.title}
        segments={[
          { label: "Endemit", path: "" },
          { label: contentPage.title, path: contentPage.uid },
        ]}
      />

      {contentPage.renderFrame && (
        <InnerPage>
          {contentPage.slices && <SliceDisplay slices={contentPage.slices} />}
        </InnerPage>
      )}

      {!contentPage.renderFrame && contentPage.slices && (
        <SliceDisplay slices={contentPage.slices} />
      )}
    </OuterPage>
  );
}
