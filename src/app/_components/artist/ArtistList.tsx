import { Artist } from "@/domain/artist/types/artist";
import ArtistCard from "@/app/_components/artist/ArtistCard";
import InnerPage from "@/app/_components/ui/InnerPage";
import clsx from "clsx";

type Props = {
  artists: Artist[];
  sortByName?: boolean;
  includeFrame?: boolean;
  title?: string | null;
  description?: string | null;
};

export default function ArtistList({
  artists,
  sortByName = false,
  includeFrame = false,
  title,
  description,
}: Props) {
  if (!artists || !artists.length) {
    return null;
  }

  const sortedArtists = sortByName
    ? [...artists].sort((a, b) => a.name.localeCompare(b.name))
    : artists;

  const content = (
    <>
      {title && <h2 className={"text-3xl text-neutral-200"}>{title}</h2>}
      {description && (
        <p className={"text-md text-neutral-400"}>{description}</p>
      )}

      <div
        className={clsx(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2",
          title || description ? "mt-8" : "mt-0"
        )}
      >
        {sortedArtists.map(artist => (
          <ArtistCard artist={artist} key={artist.id} />
        ))}
      </div>
    </>
  );

  return includeFrame ? <InnerPage>{content}</InnerPage> : content;
}
