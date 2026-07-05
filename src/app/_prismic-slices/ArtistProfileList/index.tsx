import { FC } from "react";
import { asLink, isFilled, LinkField, RichTextField } from "@prismicio/client";
import EventLineUp from "@/app/_components/event/EventLineUp";
import InnerPage from "@/app/_components/ui/InnerPage";
import { fetchArtistFromCms } from "@/domain/cms/operations/fetchArtistFromCms";
import { ArtistAtEvent } from "@/domain/artist/types/artistAtEvent";
import { getBlurDataURL } from "@/lib/util/util";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

interface ArtistProfileListItem {
  artist: {
    link_type: string;
    id?: string;
    uid?: string;
    type?: string;
    isBroken?: boolean;
  };
  name_override?: string | null;
  description_override?: RichTextField | null;
  description_override_sl?: RichTextField | null;
  image_override?: {
    url?: string | null;
    alt?: string | null;
  } | null;
  video_override?: LinkField | null;
  soundcloud_url?: string | null;
}

interface ArtistProfileListSlice {
  slice_type: string;
  variation: string;
  primary: {
    title?: string | null;
    title_sl?: string | null;
    description?: string | null;
    description_sl?: string | null;
    render_frame?: boolean;
    show_link_to_page?: boolean;
    artists?: ArtistProfileListItem[];
  };
}

const ArtistProfileList: FC<{
  slice: ArtistProfileListSlice;
  context?: SliceContext;
}> = async ({ slice, context }) => {
  const locale = context?.locale ?? "sl";
  const listTitle = pickLocalized(slice.primary, "title", locale);
  const listDescription = pickLocalized(slice.primary, "description", locale);
  const items = slice.primary.artists ?? [];

  if (items.length === 0) {
    return null;
  }

  const resolved = await Promise.all(
    items.map(async (item): Promise<ArtistAtEvent | null> => {
      if (
        !isFilled.contentRelationship(
          item.artist as Parameters<typeof isFilled.contentRelationship>[0]
        ) ||
        !item.artist.uid
      ) {
        return null;
      }

      const artist = await fetchArtistFromCms(item.artist.uid, locale);
      if (!artist) return null;

      const image = item.image_override?.url
        ? {
            src: item.image_override.url,
            alt: item.image_override.alt ?? null,
            placeholder: await getBlurDataURL(item.image_override.url),
          }
        : artist.image;

      const localizedOverride = pickLocalized(
        item,
        "description_override",
        locale
      );
      const description = isFilled.richText(localizedOverride ?? [])
        ? localizedOverride
        : artist.description;

      const video = item.video_override
        ? (asLink(item.video_override) ?? artist.video)
        : artist.video;

      return {
        ...artist,
        name: item.name_override || artist.name,
        image,
        description,
        video,
        start_time: null,
        end_time: null,
        duration: 0,
        stage: null,
        soundcloudUrl: item.soundcloud_url || null,
      };
    })
  );

  const artists = resolved.filter((a): a is ArtistAtEvent => a !== null);

  if (artists.length === 0) {
    return null;
  }

  const content = (
    <>
      {listTitle && (
        <h2 className="text-3xl text-neutral-200">{listTitle}</h2>
      )}
      {listDescription && (
        <p className="text-md text-neutral-400 mb-8">{listDescription}</p>
      )}
      <EventLineUp artists={artists} />
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

export default ArtistProfileList;
