import { ProductCategory, ProductStatus } from "@/domain/product/types/product";
import Link from "next/link";
import ProductStatusTag from "@/components/product/ProductStatusTag";
import Image from "next/image";
import { formatPrice } from "@/lib/formatting";
import { getProductLink } from "@/domain/product/actions";

interface ProductCardProps {
  video?: string;
  image?: {
    src: string;
    alt?: string;
  };
  name: string;
  price: number;
  uid: string;
  category: ProductCategory;
  status: ProductStatus;
  callToAction?: string;
}

export default function ProductCard({
  status,
  category,
  uid,
  price,
  name,
  image,
  video,
  callToAction,
}: ProductCardProps) {
  return (
    <div
      className={
        "group bg-neutral-950 p-2 hover:bg-black rounded-sm text-left w-full"
      }
    >
      <ProductStatusTag
        status={status}
        className={"translate-y-2 translate-x-2"}
      />

      <Link href={getProductLink(uid, category)}>
        <div className={"aspect-square overflow-hidden "}>
          {video && (
            <div className="aspect-square w-full  object-cover group-hover:opacity-75 xl:aspect-7/8 overflow-hidden group-hover:scale-125 transition-transform ease-in-out">
              <video
                src={video}
                loop={true}
                muted={true}
                autoPlay={true}
                playsInline={true}
              />
            </div>
          )}

          {image && !video && (
            <Image
              src={image.src}
              alt={image.alt ?? name}
              width={800}
              height={800}
              loading="lazy"
              className="aspect-square w-full   object-cover group-hover:opacity-75 xl:aspect-7/8 group-hover:scale-125 transition-transform ease-in-out"
            />
          )}
        </div>

        <div className={"flex my-4 w-full px-2"}>
          <div className={"flex-1"}>
            <h3 className="text-2xl text-neutral-200">{name}</h3>
            <p className="category text-sm text-neutral-400">
              {callToAction ?? category}
            </p>
          </div>
          <div className={"pl-2"}>
            <p className="text-lg font-medium text-gray-500">
              {formatPrice(price)}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
