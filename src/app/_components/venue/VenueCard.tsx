import Link from "next/link";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import { CmsImage } from "@/domain/cms/types/common";
import React from "react";
import clsx from "clsx";

interface Props {
  image?: CmsImage | null;
  name: string;
  location?: string;
  link: string | null;
}

export default function VenueCard({ link, location, name, image }: Props) {
  return (
    <div
      className={
        "group bg-neutral-950 p-2 hover:bg-neutral-900 rounded-sm text-left w-full"
      }
    >
      <Link
        href={link ? link : ""}
        target={link?.startsWith("http") ? "_blank" : "_self"}
        className={clsx(!link && "pointer-events-none")}
      >
        <div className={"aspect-square overflow-hidden relative "}>
          <div className="absolute left-0 top-0 right-0 w-full bottom-0 border-[13px] z-20 border-neutral-100 scale-125 group-hover:scale-100 transition-transform duration-300 pointer-events-none" />

          {image && (
            <ImageWithFallback
              src={image.src}
              alt={image.alt ?? name}
              placeholder={image.placeholder}
              width={800}
              height={800}
              loading="lazy"
              className="aspect-square w-full object-cover group-hover:scale-125 group-hover:rotate-12 transition-all !duration-500 ease-out  xl:aspect-7/8 "
            />
          )}
        </div>

        <div className={"flex my-4 w-full px-2"}>
          <div className={"flex-1"}>
            <h3 className="text-2xl text-neutral-200">{name}</h3>
            <p className="text-sm ">
              <span className={"text-neutral-200"}>{location}</span>
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
