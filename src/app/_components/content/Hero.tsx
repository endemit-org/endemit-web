import Link from "next/link";
import React from "react";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import { CmsImage } from "@/domain/cms/types/common";
import EventTicketAvailableStatus from "@/app/_components/event/EventTicketAvailableStatus";

export interface HeroProps {
  heading: string;
  description?: string;
  link?: string;
  backgroundImage?: CmsImage;
  backgroundVideo?: string;
  overlayOpacity?: number;
  specialMarker?: "None" | "Tickets available";
}

export default function Hero({
  heading,
  description,
  link,
  backgroundImage,
  backgroundVideo,
  overlayOpacity = 50,
  specialMarker,
}: HeroProps) {
  return (
    <Link
      href={link ?? "#"}
      className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-neutral-950 border-8 border-neutral-950 group"
    >
      {link && (
        <div className="absolute inset-0 border-[20px] border-neutral-100 scale-125 group-hover:scale-100 transition-transform duration-300 pointer-events-none z-20" />
      )}

      {specialMarker && specialMarker === "Tickets available" && (
        <EventTicketAvailableStatus className=" lg:left-auto right-6 lg:top-auto lg:bottom-6 z-20" />
      )}

      {backgroundImage && !backgroundVideo && (
        <>
          <ImageWithFallback
            src={backgroundImage.src}
            alt={backgroundImage?.alt ?? ""}
            placeholder={backgroundImage.placeholder}
            fill
            className="object-cover group-hover:scale-125 group-hover:rotate-12 group-hover:blur-sm transition-all !duration-500 ease-out"
            priority
          />
          <div
            className="absolute inset-0 bg-neutral-950"
            style={{ opacity: overlayOpacity / 100 }}
          />
        </>
      )}

      {backgroundVideo && (
        <video
          src={backgroundVideo}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-125 group-hover:rotate-12 group-hover:blur-sm transition-all !duration-500 ease-out"
          autoPlay={true}
          muted={true}
          loop={true}
          playsInline={true}
        />
      )}

      {(heading || description) && (
        <div className="absolute bottom-0 z-10 w-full mx-auto px-4 sm:px-6 lg:px-6  overflow-hidden ">
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent -left-6 -right-6 -bottom-12  h-[100%]" />
          <div className="flex flex-col text-left relative z-10 group-hover:scale-95 transition-transform duration-300 pb-6 pt-3">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-200 max-w-4xl text-shadow"
              style={{ textShadow: "0 4px 8px rgba(0, 0, 0, 0.9)" }}
            >
              {heading}
            </h1>

            {description && (
              <p
                className="text-lg sm:text-xl text-neutral-200/90 max-w-2xl "
                style={{ textShadow: "0 4px 8px rgba(0, 0, 0, 0.9)" }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
