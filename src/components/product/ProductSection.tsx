import { Product } from "@/types/product";
import ProductCard from "@/components/product/ProductCard";
import clsx from "clsx";

interface Props {
  products: Product[];
  title?: string;
  description?: string;
  renderFrame?: boolean;
}

export default function ProductSection({
  products,
  title,
  description,
  renderFrame = true,
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

      <div
        className={clsx(
          "flex gap-0.5 flex-wrap w-full",
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
            category={product.category}
          />
        ))}
      </div>
    </section>
  );
}
