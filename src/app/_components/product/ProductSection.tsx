import { Product } from "@/domain/product/types/product";
import ProductCard from "@/app/_components/product/ProductCard";
import clsx from "clsx";
import CardGrid from "@/app/_components/grid/CardGrid";

interface Props {
  products: Product[];
  title?: string;
  description?: string;
  renderFrame?: boolean;
  gridType?: "small" | "large";
  quickAddToCart?: boolean;
  /** Hide items that would orphan on a partial last row (see CardGrid). */
  trimOrphans?: boolean;
}

export default function ProductSection({
  products,
  title,
  description,
  renderFrame = true,
  gridType,
  quickAddToCart = false,
  trimOrphans = false,
}: Props) {
  if (products.length === 0) {
    return;
  }

  return (
    <section
      className={clsx(
        renderFrame && "p-4 lg:p-10 max-lg:py-8 bg-neutral-800 rounded-md",
        !renderFrame && "py-8"
      )}
    >
      {title && <h2 className={"text-3xl text-neutral-200"}>{title}</h2>}
      {description && (
        <p className={"text-md text-neutral-400"}>{description}</p>
      )}

      <CardGrid
        trimOrphans={trimOrphans}
        className={clsx(
          gridType !== "small" && "!grid-cols-1 @5xl:!grid-cols-2",
          title || description ? "mt-8" : "mt-0"
        )}
      >
        {products.map(product => (
          <ProductCard
            status={product.status}
            key={product.id}
            image={product.images[0]}
            video={product.video ?? undefined}
            name={product.name}
            uid={product.uid}
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            category={product.category}
            quickAddToCart={quickAddToCart}
            product={product}
          />
        ))}
      </CardGrid>
    </section>
  );
}
