import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";
import Link from "next/link";
import { Artist } from "@/domain/artist/types/artist";
import React from "react";

type Props = {
  artist: Artist;
};

export default function ArtistCard({ artist }: Props) {
  return (
    <Link
      key={artist.id}
      href={`/artists/${artist.uid}`}
      className="group bg-neutral-950 p-2 hover:bg-neutral-900 rounded-sm text-left w-full relative  "
    >
      <div className={"aspect-square overflow-hidden relative "}>
        <div className="absolute left-0 top-0 right-0 w-full bottom-0 border-[13px] z-20 border-neutral-100 scale-125 group-hover:scale-100 transition-transform duration-300 pointer-events-none" />

        {artist.image?.src && (
          <ImageWithFallback
            src={artist.image.src}
            alt={artist.image.alt || artist.name}
            placeholder={artist.image.placeholder}
            fill
            className="aspect-square w-full object-cover group-hover:scale-125 group-hover:rotate-12 transition-all !duration-500 ease-out  xl:aspect-7/8 contrast-125 grayscale  hover:grayscale-0 hover:contrast-100  "
          />
        )}
      </div>

      <div className="relative p-4 flex  flex-col items-center justify-center">
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
            " w-full  flex gap-x-1  z-10 items-center absolute bottom-2 justify-center left-0"
          }
        >
          <div
            className={"uppercase font-heading pt-2 text-neutral-500 text-xs"}
          >
            Part of
          </div>{" "}
          <div className={"w-14 text-neutral-300"}>
            <AnimatedEndemitLogo />
          </div>
        </div>
      )}
    </Link>
  );
}
