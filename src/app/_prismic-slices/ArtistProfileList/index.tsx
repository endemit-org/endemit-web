import { FC } from "react";
import { asLink, isFilled, LinkField, RichTextField } from "@prismicio/client";
import ArtistProfile from "@/app/_components/artist/ArtistProfile";
import InnerPage from "@/app/_components/ui/InnerPage";
import { fetchArtistFromCms } from "@/domain/cms/operations/fetchArtistFromCms";
import { CmsImage } from "@/domain/cms/types/common";
import { getBlurDataURL } from "@/lib/util/util";

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
    description?: string | null;
    render_frame?: boolean;
    show_link_to_page?: boolean;
    artists?: ArtistProfileListItem[];
  };
}

const ArtistProfileList: FC<{ slice: ArtistProfileListSlice }> = async ({
  slice,
}) => {
  const items = slice.primary.artists ?? [];

  if (items.length === 0) {
    return null;
  }

  const resolved = await Promise.all(
    items.map(async item => {
      const artist =
        isFilled.contentRelationship(
          item.artist as Parameters<typeof isFilled.contentRelationship>[0]
        ) && item.artist.uid
          ? await fetchArtistFromCms(item.artist.uid)
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
        descriptionOverride: item.description_override ?? null,
        videoOverride: item.video_override ? asLink(item.video_override) : null,
        soundcloudUrl: item.soundcloud_url || null,
      };
    })
  );

  const showLink = slice.primary.show_link_to_page ?? true;

  const content = (
    <>
      {slice.primary.title && (
        <h2 className="text-3xl text-neutral-200">{slice.primary.title}</h2>
      )}
      {slice.primary.description && (
        <p className="text-md text-neutral-400 mb-8">
          {slice.primary.description}
        </p>
      )}
      {resolved.map(
        ({
          artist,
          imageOverride,
          nameOverride,
          descriptionOverride,
          videoOverride,
          soundcloudUrl,
        }) =>
          artist ? (
            <ArtistProfile
              key={artist.id}
              artist={artist}
              coverSrc={artist.image?.src}
              imageOverride={imageOverride}
              nameOverride={nameOverride}
              descriptionOverride={descriptionOverride}
              videoOverride={videoOverride}
              soundcloudUrl={soundcloudUrl}
              showLinkToPage={showLink}
            />
          ) : null
      )}
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
