import { notFound } from "next/navigation";
import { categoryFromSlug } from "@/lib/util";
import ProductSection from "@/components/product/ProductSection";
import Breadcrumb from "@/components/Breadcrumb";
import { prismic } from "@/services/prismic";
import { fetchProductsFromCms } from "@/domain/cms/actions";
export const revalidate = 3600; // Revalidate every hour

export default async function ProductPage({
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

  const productsExistInCategory = products.length > 0;

  return (
    <div className=" mx-auto space-y-8 sm:max-w-full pt-24 px-4 lg:pt-16 ">
      <h1 className="text-3xl font-bold text-white mb-8">
        {categoryName} ({products.length})
      </h1>
      <Breadcrumb
        segments={[
          { label: "Endemit", path: "" },
          { label: "Store", path: "store" },
          { label: categoryName, path: categoryId },
        ]}
      />

      {!productsExistInCategory && (
        <div>There are currently no products in {categoryName}</div>
      )}

      {productsExistInCategory && <ProductSection products={products} />}
    </div>
  );
}
