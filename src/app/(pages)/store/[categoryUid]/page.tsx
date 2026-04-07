import { notFound } from "next/navigation";
import { getCategoriesWithSlugs, getCategoryFromSlug } from "@/lib/util/util";
import ProductSection from "@/app/_components/product/ProductSection";
import { prismic } from "@/lib/services/prismic";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import OuterPage from "@/app/_components/ui/OuterPage";
import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import { buildOpenGraphImages, buildOpenGraphObject } from "@/lib/util/seo";
import { isProductVisible } from "@/domain/product/businessLogic";

export async function generateStaticParams() {
  const categories = getCategoriesWithSlugs;

  return categories.map(category => ({
    categoryUid: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    categoryUid: string;
  }>;
}) {
  const { categoryUid } = await params;

  const categoryName = getCategoryFromSlug(categoryUid);

  if (!categoryName) {
    notFound();
  }

  const title = `${categoryName} • Store`;
  const description = `Official Endemit ${categoryName} available to purchase securely online.`;
  const images = buildOpenGraphImages({});
  const url = `https://endemit.org/store/${categoryUid}`;

  return buildOpenGraphObject({ title, description, images, url, type: "website" });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{
    categoryUid: string;
  }>;
}) {
  const { categoryUid } = await params;

  const categoryName = getCategoryFromSlug(categoryUid);

  if (!categoryName) {
    notFound();
  }

  const allProducts = await fetchProductsFromCms({
    filters: [prismic.filter.at("my.product.product_category", categoryName)],
  });
  const products = allProducts?.filter(isProductVisible) ?? [];

  const productsExistInCategory = products.length > 0;

  return (
    <OuterPage>
      <PageHeadline
        title={categoryName}
        segments={[
          { label: "Endemit", path: "" },
          { label: "Store", path: "store" },
          { label: categoryName, path: categoryUid },
        ]}
      />

      {!productsExistInCategory && (
        <InnerPage>
          <div>There are currently no products in {categoryName}</div>
        </InnerPage>
      )}

      {productsExistInCategory && <ProductSection products={products} />}
    </OuterPage>
  );
}
