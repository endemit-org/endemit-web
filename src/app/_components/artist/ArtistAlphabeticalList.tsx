import { Artist } from "@/domain/artist/types/artist";
import Link from "next/link";
import Image from "next/image";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";

type Props = {
  artists: Artist[];
};

export default function ArtistAlphabeticalList({ artists }: Props) {
  if (!artists || !artists.length) {
    return;
  }

  const sortedArtists = [...artists].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 ">
      {sortedArtists.map(artist => (
        <Link
          key={artist.id}
          href={`/artists/${artist.uid}`}
          className="group relative overflow-hidden  bg-neutral-950  border-8 border-neutral-950 hover:border-neutral-900 hover:bg-neutral-900 "
        >
          <div className="relative aspect-square overflow-hidden">
            {artist.image?.src && (
              <Image
                src={artist.image.src}
                alt={artist.image.alt || artist.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent opacity-60" />
          </div>

          <div className="relative p-4 min-h-[80px] flex  flex-col items-center justify-center">
            <div className="relative text-2xl font-bold text-neutral-200  text-center leading-tight font-heading uppercase">
              {artist.name}
            </div>
            <div className="text-4xl font-bold text-neutral-200  text-center leading-tight font-heading uppercase absolute -scale-x-100 opacity-20 ">
              {artist.name}
            </div>
          </div>
          {artist.isEndemitCrew && (
            <div
              className={
                " w-full  flex gap-x-1  z-10 items-center absolute bottom-0 justify-center"
              }
            >
              <div
                className={
                  "uppercase font-heading pt-2 text-neutral-500 text-xs"
                }
              >
                Part of
              </div>{" "}
              <div className={"w-14 text-neutral-300"}>
                <AnimatedEndemitLogo />
              </div>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
