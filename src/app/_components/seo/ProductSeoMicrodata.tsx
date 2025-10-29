import { Product } from "@/domain/product/types/product";
import SeoSchema from "@/app/_components/seo/SeoSchema";
import { getProductLink } from "@/domain/product/actions/getProductLink";

type Props = {
  product: Product;
};

export default function ProductSeoMicrodata({ product }: Props) {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map(img => img.src),
    url: getProductLink(product.uid, product.category, true),
    offers: {
      "@type": "Offer",
      price: product.price.toString(),
      priceCurrency: product.currency || "EUR",
      availability:
        product.status === "Available"
          ? "https://schema.org/InStock"
          : product.status === "Preorder"
            ? "https://schema.org/PreOrder"
            : "https://schema.org/OutOfStock",
      url: getProductLink(product.uid, product.category, true),
    },
  };

  return <SeoSchema>{productSchema}</SeoSchema>;
}
