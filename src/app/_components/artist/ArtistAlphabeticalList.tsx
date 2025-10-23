import { Artist } from "@/domain/artist/types/artist";
import Link from "next/link";
import Image from "next/image";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ">
      {sortedArtists.map(artist => (
        <Link
          key={artist.id}
          href={`/artists/${artist.uid}`}
          className="group relative overflow-hidden rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 transition-all duration-300"
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
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60" />
          </div>

          <div className="relative p-4 min-h-[80px] flex items-center justify-center">
            {/* Blurred name background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-cyan-400 blur-md opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                {artist.name}
              </span>
            </div>

            {/* Sharp name foreground */}
            <span className="relative text-2xl font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center leading-tight">
              {artist.name}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
