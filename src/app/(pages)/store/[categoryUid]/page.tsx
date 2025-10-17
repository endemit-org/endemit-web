import { notFound } from "next/navigation";
import { categoriesWithSlugs, categoryFromSlug } from "@/lib/util";
import ProductSection from "@/components/product/ProductSection";
import { prismic } from "@/services/prismic";
import { fetchProductsFromCms } from "@/domain/cms/actions";
import PageHeadline from "@/components/PageHeadline";
import InnerPage from "@/components/InnerPage";
import OuterPage from "@/components/OuterPage";
export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const categories = categoriesWithSlugs;
  return categories.map(category => ({
    categoryId: category.slug,
  }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{
    categoryId: string;
  }>;
}) {
  const { categoryId } = await params;

  const categoryName = categoryFromSlug(categoryId);

  if (!categoryName) {
    notFound();
  }

  const products = await fetchProductsFromCms({
    filters: [prismic.filter.at("my.product.product_category", categoryName)],
  });

  const productsExistInCategory = products && products.length > 0;

  return (
    <OuterPage>
      <PageHeadline
        title={categoryName}
        segments={[
          { label: "Endemit", path: "" },
          { label: "Store", path: "store" },
          { label: categoryName, path: categoryId },
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
