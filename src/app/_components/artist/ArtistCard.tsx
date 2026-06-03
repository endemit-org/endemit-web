import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";
import Link from "next/link";
import clsx from "clsx";
import { Artist } from "@/domain/artist/types/artist";
import { CmsImage } from "@/domain/cms/types/common";
import React from "react";

type Props = {
  artist: Artist;
  imageOverride?: CmsImage | null;
  nameOverride?: string | null;
  grayscale?: boolean;
  showName?: boolean;
  linkOverride?: string | null;
};

export default function ArtistCard({
  artist,
  imageOverride,
  nameOverride,
  grayscale = true,
  showName = true,
  linkOverride = null,
}: Props) {
  const image = imageOverride ?? artist.image;
  const name = nameOverride || artist.name;
  const href = linkOverride ?? `/artists/${artist.uid}`;
  const isExternal = /^https?:\/\//i.test(href);

  return (
    <Link
      key={artist.id}
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group bg-neutral-950 p-2 hover:bg-neutral-900 rounded-sm text-left w-full relative  "
    >
      <div className={"aspect-square overflow-hidden relative "}>
        <div className="absolute left-0 top-0 right-0 w-full bottom-0 border-[13px] z-20 border-neutral-100 scale-125 group-hover:scale-100 transition-transform duration-300 pointer-events-none" />

        {image?.src && (
          <ImageWithFallback
            src={image.src}
            alt={image.alt || name}
            placeholder={image.placeholder}
            fill
            className={clsx(
              "aspect-square w-full object-cover group-hover:scale-125 group-hover:rotate-12 transition-all !duration-500 ease-out xl:aspect-7/8",
              grayscale &&
                "contrast-125 grayscale hover:grayscale-0 hover:contrast-100"
            )}
          />
        )}
      </div>

      {showName && (
        <div className="relative p-4 flex  flex-col items-center justify-center">
          <div className="relative text-2xl font-bold text-neutral-200  text-center leading-tight font-heading uppercase">
            {name}
          </div>
          <div className="text-4xl font-bold text-neutral-200  text-center leading-tight font-heading uppercase absolute -scale-x-100 opacity-20 ">
            {name}
          </div>
        </div>
      )}
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
