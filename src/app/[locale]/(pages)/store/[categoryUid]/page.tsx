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
import { translateCategory } from "@/lib/util/translateCategory";

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
    locale: string;
    categoryUid: string;
  }>;
}) {
  const { locale, categoryUid } = await params;
  const loc = locale === "en" ? "en" : "sl";
  const t = await getTranslations({ locale: loc, namespace: "store" });
  const tCat = await getTranslations({
    locale: loc,
    namespace: "store.categoryNames",
  });

  const categoryName = getCategoryFromSlug(categoryUid);

  if (!categoryName) {
    notFound();
  }

  const categoryLabel = translateCategory(tCat, categoryName);
  const title = `${categoryLabel} • ${t("breadcrumb.store")}`;
  const description = t("category.metaDescription", {
    category: categoryLabel,
  });
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
  const tCat = await getTranslations("store.categoryNames");

  const categoryName = getCategoryFromSlug(categoryUid);

  if (!categoryName) {
    notFound();
  }

  const categoryLabel = translateCategory(tCat, categoryName);

  const allProducts = await fetchProductsFromCms({
    filters: [prismic.filter.at("my.product.product_category", categoryName)],
    locale: loc,
  });
  const products = allProducts?.filter(isProductVisible) ?? [];

  const productsExistInCategory = products.length > 0;

  return (
    <OuterPage>
      <PageHeadline
        title={categoryLabel}
        segments={[
          { label: "Endemit", path: "" },
          { label: t("breadcrumb.store"), path: "store" },
          { label: categoryLabel, path: categoryUid },
        ]}
      />

      {!productsExistInCategory && (
        <InnerPage>
          <div>{t("category.empty", { categoryName: categoryLabel })}</div>
        </InnerPage>
      )}

      {productsExistInCategory && <ProductSection products={products} />}
    </OuterPage>
  );
}
