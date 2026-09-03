import { FC } from "react";
import { Content, asLink, isFilled } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import VerticalVideoShowcase from "@/app/_components/content/VerticalVideoShowcase";
import { getBlurDataURL, getResizedPrismicImage } from "@/lib/util/util";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

/**
 * Props for `VideoShowcase`.
 */
export type VideoShowcaseProps = SliceComponentProps<
  Content.VideoShowcaseSlice,
  SliceContext
>;

/**
 * Fallback poster when the editor didn't upload one: Vimeo's own thumbnail
 * via the public oEmbed endpoint. Cached for a day; failures just mean no
 * poster under the preview loop.
 */
async function getVimeoThumbnail(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
        `https://vimeo.com/${videoId}`
      )}&width=720`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail_url?: unknown };
    return typeof data.thumbnail_url === "string" ? data.thumbnail_url : null;
  } catch {
    return null;
  }
}

/**
 * Component for "VideoShowcase" Slices: a vertical 9:16 Vimeo video, Hero
 * style — the whole slice links to the CTA target, with the white hover
 * frame. Desktop shows text beside the video over a blurred video ambilight;
 * mobile overlays the text on the video (tapping it follows the link) and
 * play runs inline on every viewport.
 */
const VideoShowcase: FC<VideoShowcaseProps> = async ({ slice, context }) => {
  const { primary } = slice;
  const locale = context?.locale ?? "sl";

  // Accept a bare ID or a pasted Vimeo URL.
  const vimeoVideoId = isFilled.keyText(primary.vimeo_video_id)
    ? (primary.vimeo_video_id.match(/\d{6,}/)?.[0] ?? null)
    : null;
  if (!vimeoVideoId) {
    return null;
  }

  const title = pickLocalized(primary, "title", locale);
  const description = pickLocalized(primary, "description", locale);
  const ctaLabel = pickLocalized(primary, "cta_label", locale);
  const href = isFilled.link(primary.cta_link)
    ? asLink(primary.cta_link)
    : null;

  const poster = isFilled.image(primary.poster)
    ? {
        src: getResizedPrismicImage(primary.poster.url, { width: 720 }),
        alt: primary.poster.alt || "",
      }
    : await getVimeoThumbnail(vimeoVideoId).then(src =>
        src ? { src, alt: "" } : null
      );

  // Square art above the text, desktop only: video when present, promo
  // image as fallback — same either-or as the event ticket dialog.
  const artVideo = isFilled.link(primary.art_video)
    ? primary.art_video.url
    : null;
  const artImage =
    !artVideo && isFilled.image(primary.art_image)
      ? {
          src: primary.art_image.url,
          alt: primary.art_image.alt || "",
          placeholder: await getBlurDataURL(primary.art_image.url),
        }
      : null;

  const art = artVideo ? (
    <div className="w-full max-w-[240px] rounded-lg overflow-hidden">
      <video
        src={artVideo}
        loop={true}
        muted={true}
        autoPlay={true}
        playsInline={true}
        className="aspect-square w-full object-cover"
      />
    </div>
  ) : artImage ? (
    <div className="w-full max-w-[240px] rounded-lg overflow-hidden">
      <ImageWithFallback
        src={artImage.src}
        alt={artImage.alt}
        width={400}
        height={400}
        quality={85}
        className="aspect-square w-full object-cover"
        placeholder={artImage.placeholder}
      />
    </div>
  ) : null;

  const hasText =
    isFilled.keyText(title) ||
    isFilled.richText(description) ||
    (href && isFilled.keyText(ctaLabel));

  const textShadow = { textShadow: "0 4px 8px rgba(0, 0, 0, 0.9)" };

  // Not a button — the whole slice is the link; the label renders as a tag
  // badge, same treatment as the Hero's marker.
  const ctaCue =
    href && isFilled.keyText(ctaLabel) ? (
      <span className="self-start backdrop-blur-lg py-1 px-3 w-fit text-neutral-300 text-sm uppercase font-bold border border-neutral-700">
        {ctaLabel}
      </span>
    ) : null;

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <VerticalVideoShowcase
        vimeoVideoId={vimeoVideoId}
        poster={poster}
        href={href}
        overlay={
          hasText ? (
            <div className="flex flex-col gap-2 text-left">
              {isFilled.keyText(title) && (
                <h2
                  className="text-2xl font-bold text-neutral-200"
                  style={textShadow}
                >
                  {title}
                </h2>
              )}
              {isFilled.richText(description) && (
                <div className="text-sm text-neutral-200/90" style={textShadow}>
                  <RichTextDisplay richText={description} />
                </div>
              )}
              {ctaCue}
            </div>
          ) : null
        }
      >
        {hasText || art ? (
          <div className="hidden md:flex flex-col gap-4 justify-center text-left">
            {art}
            {isFilled.keyText(title) && (
              <h2
                className="text-4xl lg:text-5xl font-bold text-neutral-200"
                style={textShadow}
              >
                {title}
              </h2>
            )}
            {isFilled.richText(description) && (
              <div className="text-lg text-neutral-200/90" style={textShadow}>
                <RichTextDisplay richText={description} />
              </div>
            )}
            {ctaCue}
          </div>
        ) : null}
      </VerticalVideoShowcase>
    </section>
  );
};

export default VideoShowcase;
