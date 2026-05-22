import { FC } from "react";
import { isFilled } from "@prismicio/client";
import ArtistProfile from "@/app/_components/artist/ArtistProfile";
import InnerPage from "@/app/_components/ui/InnerPage";
import { fetchArtistFromCms } from "@/domain/cms/operations/fetchArtistFromCms";

interface ArtistProfileListItem {
  artist: {
    link_type: string;
    id?: string;
    uid?: string;
    type?: string;
    isBroken?: boolean;
  };
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
      if (
        !isFilled.contentRelationship(
          item.artist as Parameters<typeof isFilled.contentRelationship>[0]
        ) ||
        !item.artist.uid
      ) {
        return null;
      }
      return await fetchArtistFromCms(item.artist.uid);
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
      {resolved.map(artist =>
        artist ? (
          <ArtistProfile
            key={artist.id}
            artist={artist}
            coverSrc={artist.image?.src}
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
