import { FC } from "react";
import { asLink, isFilled, LinkField } from "@prismicio/client";
import clsx from "clsx";
import ArtistCard from "@/app/_components/artist/ArtistCard";
import BlurredArtistCard from "@/app/_components/artist/BlurredArtistCard";
import InnerPage from "@/app/_components/ui/InnerPage";
import { fetchArtistFromCms } from "@/domain/cms/operations/fetchArtistFromCms";
import { CmsImage } from "@/domain/cms/types/common";
import { getBlurDataURL } from "@/lib/util/util";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

// Inline types until slicemachine regenerates `prismicio-types.d.ts`.
interface ArtistLineupItem {
  artist: {
    link_type: string;
    id?: string;
    uid?: string;
    type?: string;
    isBroken?: boolean;
  };
  name_override?: string | null;
  image_override?: {
    url?: string | null;
    alt?: string | null;
  } | null;
}

interface ArtistLineupSlice {
  slice_type: string;
  variation: string;
  primary: {
    title?: string | null;
    title_sl?: string | null;
    description?: string | null;
    description_sl?: string | null;
    render_frame?: boolean;
    show_names?: boolean;
    link_override?: LinkField;
    artists?: ArtistLineupItem[];
  };
}

const ArtistLineup: FC<{
  slice: ArtistLineupSlice;
  context?: SliceContext;
}> = async ({ slice, context }) => {
  const locale = context?.locale ?? "sl";
  const lineupTitle = pickLocalized(slice.primary, "title", locale);
  const lineupDescription = pickLocalized(slice.primary, "description", locale);
  const items = slice.primary.artists ?? [];

  if (items.length === 0) {
    return null;
  }

  const showNames = slice.primary.show_names ?? true;
  const linkOverride = slice.primary.link_override
    ? (asLink(slice.primary.link_override) ?? null)
    : null;

  const resolved = await Promise.all(
    items.map(async item => {
      const artist =
        isFilled.contentRelationship(
          item.artist as Parameters<typeof isFilled.contentRelationship>[0]
        ) && item.artist.uid
          ? await fetchArtistFromCms(item.artist.uid, locale)
          : null;

      let imageOverride: CmsImage | null = null;
      if (item.image_override?.url) {
        imageOverride = {
          src: item.image_override.url,
          alt: item.image_override.alt ?? null,
          placeholder: await getBlurDataURL(item.image_override.url),
        };
      }

      return {
        artist,
        imageOverride,
        nameOverride: item.name_override ?? null,
      };
    })
  );

  const content = (
    <>
      {lineupTitle && (
        <h2 className="text-3xl text-neutral-200">{lineupTitle}</h2>
      )}
      {lineupDescription && (
        <p className="text-md text-neutral-400">{lineupDescription}</p>
      )}

      <div
        className={clsx(
          "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2",
          lineupTitle || lineupDescription ? "mt-8" : "mt-0"
        )}
      >
        {resolved.map(({ artist, imageOverride, nameOverride }, index) =>
          artist ? (
            <ArtistCard
              key={artist.id}
              artist={artist}
              imageOverride={imageOverride}
              nameOverride={nameOverride}
              grayscale={false}
              showName={showNames}
              linkOverride={linkOverride}
              showCrewBadge={false}
            />
          ) : (
            <BlurredArtistCard key={`blurred-${index}`} seed={index} />
          )
        )}
      </div>
    </>
  );

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      {slice.primary.render_frame ? <InnerPage>{content}</InnerPage> : content}
    </section>
  );
};

export default ArtistLineup;
