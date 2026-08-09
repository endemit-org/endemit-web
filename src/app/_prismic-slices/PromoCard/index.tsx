import { FC } from "react";
import { Content, asLink, isFilled } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { Link } from "@/i18n/navigation";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import { getBlurDataURL } from "@/lib/util/util";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";
import CountdownGate from "./CountdownGate";

/**
 * Props for `PromoCard`.
 */
export type PromoCardProps = SliceComponentProps<
  Content.PromoCardSlice,
  SliceContext
>;

/**
 * A single promo card: image (or muted looping video, same approach as the
 * Hero slice) with an adjoined black CTA bar below. The whole card is one
 * link, always same-tab. Sized by its container — in the mobile menu that's
 * the promo frame.
 */
const PromoCard: FC<PromoCardProps> = async ({ slice, context }) => {
  const { primary } = slice;
  const locale = context?.locale ?? "sl";

  const cta = pickLocalized(primary, "cta", locale);
  const href = isFilled.link(primary.link) ? asLink(primary.link) : null;

  const videoUrl = isFilled.link(primary.video) ? primary.video.url : null;

  // Optional deadline: expired promos render nothing. The client gate also
  // hides at zero on pages rendered before the deadline passed.
  const countdownTo = isFilled.timestamp(primary.countdown_to)
    ? primary.countdown_to
    : null;
  if (countdownTo && new Date(countdownTo).getTime() <= Date.now()) {
    return null;
  }

  const image =
    !videoUrl && isFilled.image(primary.image)
      ? {
          src: primary.image.url,
          alt: primary.image.alt || "",
          placeholder: await getBlurDataURL(primary.image.url),
        }
      : null;

  if (!videoUrl && !image) {
    return null;
  }

  const card = (
    <>
      <div className="relative aspect-square bg-neutral-900">
        {videoUrl ? (
          <video
            src={videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay={true}
            muted={true}
            loop={true}
            playsInline={true}
          />
        ) : (
          image && (
            <ImageWithFallback
              src={image.src}
              alt={image.alt}
              placeholder={image.placeholder}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )
        )}
      </div>
      {cta && (
        <div className="bg-black px-3 py-2.5 text-neutral-100 text-sm font-heading uppercase tracking-widest leading-tight">
          {cta}
        </div>
      )}
    </>
  );

  const cardClassName =
    "group block w-full overflow-hidden rounded-xl border border-neutral-800";

  const linked = href ? (
    <Link href={href} className={cardClassName}>
      {card}
    </Link>
  ) : (
    <div className={cardClassName}>{card}</div>
  );

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      {countdownTo ? (
        <CountdownGate deadline={countdownTo}>{linked}</CountdownGate>
      ) : (
        linked
      )}
    </section>
  );
};

export default PromoCard;
