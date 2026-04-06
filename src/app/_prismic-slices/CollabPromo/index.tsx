import { FC } from "react";
import { isFilled } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import ProductCard from "@/app/_components/product/ProductCard";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import { getBlurDataURL } from "@/lib/util/util";
import clsx from "clsx";

/**
 * Props for `CollabPromo`.
 * Note: Type will be available after running `pnpm exec slicemachine`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CollabPromoProps = SliceComponentProps<any>;

const COLOR_THEMES = {
  Dark: "bg-neutral-900",
  Muted: "bg-neutral-700",
  Vibrant: "bg-gradient-to-br from-orange-600 to-amber-700",
} as const;

/**
 * Component for "CollabPromo" Slices.
 */
const CollabPromo: FC<CollabPromoProps> = async ({ slice }) => {
  const { primary } = slice;

  // Fetch products
  const productIds = primary.products
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ?.map((item: any) => item.product?.id)
    .filter(Boolean);

  let products = await fetchProductsFromCms({});
  products = products
    ? products.filter(product => productIds?.includes(product.id))
    : [];

  // Get media
  const hasVideo = isFilled.link(primary.media_video);
  const hasImage = isFilled.image(primary.media_image);
  const mediaImagePlaceholder = hasImage
    ? await getBlurDataURL(primary.media_image.url)
    : undefined;

  // Get logo
  const hasLogo = isFilled.image(primary.logo);
  const logoPlaceholder = hasLogo
    ? await getBlurDataURL(primary.logo.url)
    : undefined;

  // Layout and theme
  const isInfoLeft = primary.layout_position !== "Info Right";
  const colorTheme =
    (primary.color_theme as keyof typeof COLOR_THEMES) || "Dark";
  const bgClass = COLOR_THEMES[colorTheme] || COLOR_THEMES.Dark;
  const renderFrame = primary.render_frame !== false;

  // Title
  const title = primary.title || "";

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className={clsx(
        renderFrame && "rounded-lg overflow-hidden",
        renderFrame && bgClass
      )}
    >
      <div
        className={clsx(
          "flex gap-6 lg:gap-10 relative z-10",
          renderFrame ? "p-6 lg:p-10" : "py-6",
          "flex-col lg:flex-row",
          !isInfoLeft && "lg:flex-row-reverse"
        )}
      >
        {/* Info Panel */}
        <div className="flex-1 flex flex-col lg:max-w-md">
          {/* Logo + Title */}
          <div className="flex items-center gap-4 mb-4">
            {hasLogo && (
              <div className="flex-shrink-0">
                <ImageWithFallback
                  src={primary.logo.url}
                  alt={primary.logo.alt || "Collaborator logo"}
                  width={80}
                  height={80}
                  placeholder={logoPlaceholder}
                  className="h-12 lg:h-16 w-auto object-contain"
                />
              </div>
            )}
            {title && (
              <h2 className="text-2xl lg:text-3xl font-bold text-neutral-100">
                {title}
              </h2>
            )}
          </div>

          {/* Description */}
          {isFilled.richText(primary.description) && (
            <div className="text-neutral-300 mb-6">
              <RichTextDisplay richText={primary.description} />
            </div>
          )}

          {/* Media */}
          {(hasVideo || hasImage) && (
            <div className="mt-auto">
              {hasVideo ? (
                <video
                  src={primary.media_video.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full rounded-lg aspect-video object-cover"
                />
              ) : hasImage ? (
                <ImageWithFallback
                  src={primary.media_image.url}
                  alt={primary.media_image.alt || ""}
                  width={600}
                  height={400}
                  placeholder={mediaImagePlaceholder}
                  className="w-full rounded-lg aspect-video object-cover"
                />
              ) : null}
            </div>
          )}
        </div>

        {/* Products Panel */}
        <div className="flex-1 lg:flex-[1.5]">
          <div
            className={clsx(
              "grid gap-2",
              products.length === 2 && "grid-cols-1 sm:grid-cols-2",
              products.length >= 3 &&
                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {products.map(product => (
              <ProductCard
                key={product.id}
                status={product.status}
                image={product.images[0]}
                video={product.video ?? undefined}
                name={product.name}
                uid={product.uid}
                price={product.price}
                category={product.category}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollabPromo;
