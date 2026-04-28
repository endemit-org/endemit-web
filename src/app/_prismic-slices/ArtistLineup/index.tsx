import { FC } from "react";
import { isFilled } from "@prismicio/client";
import clsx from "clsx";
import ArtistCard from "@/app/_components/artist/ArtistCard";
import BlurredArtistCard from "@/app/_components/artist/BlurredArtistCard";
import InnerPage from "@/app/_components/ui/InnerPage";
import { fetchArtistFromCms } from "@/domain/cms/operations/fetchArtistFromCms";

// Inline types until slicemachine regenerates `prismicio-types.d.ts`.
interface ArtistLineupItem {
  artist: {
    link_type: string;
    id?: string;
    uid?: string;
    type?: string;
    isBroken?: boolean;
  };
}

interface ArtistLineupSlice {
  slice_type: string;
  variation: string;
  primary: {
    title?: string | null;
    description?: string | null;
    render_frame?: boolean;
    artists?: ArtistLineupItem[];
  };
}

const ArtistLineup: FC<{ slice: ArtistLineupSlice }> = async ({ slice }) => {
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

  const content = (
    <>
      {slice.primary.title && (
        <h2 className="text-3xl text-neutral-200">{slice.primary.title}</h2>
      )}
      {slice.primary.description && (
        <p className="text-md text-neutral-400">{slice.primary.description}</p>
      )}

      <div
        className={clsx(
          "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2",
          slice.primary.title || slice.primary.description ? "mt-8" : "mt-0"
        )}
      >
        {resolved.map((artist, index) =>
          artist ? (
            <ArtistCard key={artist.id} artist={artist} />
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
