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
import { getTranslations, setRequestLocale } from "next-intl/server";

// Static until next deploy - no ISR
export const revalidate = false;

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
    locale: string;
    categoryUid: string;
  }>;
}) {
  const { locale, categoryUid } = await params;
  setRequestLocale(locale as "sl" | "en");
  const loc = locale === "en" ? "en" : "sl";
  const t = await getTranslations("store");

  const categoryName = getCategoryFromSlug(categoryUid);

  if (!categoryName) {
    notFound();
  }

  const allProducts = await fetchProductsFromCms({
    filters: [prismic.filter.at("my.product.product_category", categoryName)],
    locale: loc,
  });
  const products = allProducts?.filter(isProductVisible) ?? [];

  const productsExistInCategory = products.length > 0;

  return (
    <OuterPage>
      <PageHeadline
        title={categoryName}
        segments={[
          { label: "Endemit", path: "" },
          { label: t("breadcrumb.store"), path: "store" },
          { label: categoryName, path: categoryUid },
        ]}
      />

      {!productsExistInCategory && (
        <InnerPage>
          <div>{t("category.empty", { categoryName })}</div>
        </InnerPage>
      )}

      {productsExistInCategory && <ProductSection products={products} />}
    </OuterPage>
  );
}
