import { fetchContentPagesFromCms } from "@/domain/cms/operations/fetchContentPagesFromCms";
import { fetchContentPageFromCms } from "@/domain/cms/operations/fetchContentPageFromCms";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import OuterPage from "@/app/_components/ui/OuterPage";
import InnerPage from "@/app/_components/ui/InnerPage";
import { notFound } from "next/navigation";
import SliceDisplay from "@/app/_components/content/SliceDisplay";
import { Metadata } from "next";
import { buildOpenGraphImages, buildOpenGraphObject } from "@/lib/util/seo";
import { getResizedPrismicImage } from "@/lib/util/util";
import clsx from "clsx";

// Static until next deploy - no ISR
export const revalidate = false;

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
  const images = buildOpenGraphImages({
    metaImage: contentPage.meta.image,
  });
  const url = `https://endemit.org/${uid}`;

  return buildOpenGraphObject({
    title,
    description,
    images,
    url,
    type: "article",
  });
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

      {contentPage.backgroundImage && (
        <>
          <div
            className={clsx(
              "absolute z-0 -top-20 h-[700px] blur-2xl -left-10 -right-10 bg-cover opacity-60 @container",
              contentPage.backgroundAnimated && "animate-blurred-backdrop"
            )}
            style={{
              backgroundImage: `url('${getResizedPrismicImage(contentPage.backgroundImage.src, { width: 400, quality: 50 })}')`,
            }}
          />
          <div
            className={clsx(
              "max-lg:hidden z-0 absolute -bottom-28 h-[800px] blur-2xl -left-10 -right-10 bg-cover opacity-60 @container",
              contentPage.backgroundAnimated && "animate-blurred-backdrop"
            )}
            style={{
              backgroundImage: `url('${getResizedPrismicImage(contentPage.backgroundImage.src, { width: 400, quality: 50 })}')`,
            }}
          />
        </>
      )}

      {contentPage.renderFrame && (
        <InnerPage>
          {contentPage.slices && <SliceDisplay slices={contentPage.slices} />}
        </InnerPage>
      )}

      {!contentPage.renderFrame && contentPage.slices && (
        <div className={"relative mx-auto space-y-8"}>
          <SliceDisplay slices={contentPage.slices} />
        </div>
      )}
    </OuterPage>
  );
}
