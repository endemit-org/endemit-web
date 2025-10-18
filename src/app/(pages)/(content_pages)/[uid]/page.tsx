import { components } from "../../../../components/prismicSlices";
import {
  fetchContentPagesFromCms,
  fetchContentPageFromCms,
} from "@/domain/cms/actions";
import { SliceZone } from "@prismicio/react";
import PageHeadline from "@/components/content/PageHeadline";
import OuterPage from "@/components/content/OuterPage";
import InnerPage from "@/components/content/InnerPage";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const contentPages = await fetchContentPagesFromCms({});

  if (!contentPages || contentPages.length === 0) {
    return [];
  }

  return contentPages.map(contentPage => ({
    uid: contentPage.uid,
  }));
}

// TODO Nejc
// export async function generateMetadata({
//   params,
// }: {
//   params: { uid: string };
// }): Promise<Metadata> {
//   const prismicProduct = (await prismic
//     .getByUID("product", params.uid)
//     .catch(() => null)) as PrismicProductDocument;
//
//   if (!prismicProduct) {
//     return {
//       title: "Product Not Found",
//     };
//   }
//
//   const product = formatProduct(prismicProduct);
//
//   return {
//     title: product.data.meta_title || product.data.title,
//     description:
//       product.meta_description ||
//       richTextToPlainText(product.data.description),
//     openGraph: {
//       title: product.data.meta_title || product.data.title,
//       description:
//         product.data.meta_description ||
//         richTextToPlainText(product.data.description),
//       images: product.data.meta_image?.url
//         ? [{ url: product.data.meta_image.url }]
//         : product.images.length > 0
//           ? [{ url: product.images[0].src }]
//           : [],
//     },
//   };
// }

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
          {contentPage.slices && (
            <SliceZone slices={contentPage.slices} components={components} />
          )}
        </InnerPage>
      )}

      {!contentPage.renderFrame && contentPage.slices && (
        <SliceZone slices={contentPage.slices} components={components} />
      )}
    </OuterPage>
  );
}
