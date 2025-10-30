import Link from "next/link";
import React from "react";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import { CmsImage } from "@/domain/cms/types/common";

export interface HeroProps {
  heading: string;
  description?: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  backgroundImage?: CmsImage;
  textAlignment?: "left" | "center";
  overlayOpacity?: number;
}

export default function Hero({
  heading,
  description,
  primaryCta,
  secondaryCta,
  backgroundImage,
  textAlignment = "center",
  overlayOpacity = 50,
}: HeroProps) {
  const alignmentClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
  };

  return (
    <Link
      href={primaryCta?.href ?? "#"}
      className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-neutral-950 border-8 border-neutral-950 group"
    >
      {primaryCta?.href && (
        <div className="absolute inset-0 border-[20px] border-white scale-125 group-hover:scale-100 transition-transform duration-300 pointer-events-none z-10" />
      )}

      {backgroundImage && (
        <>
          <ImageWithFallback
            src={backgroundImage.src}
            alt={backgroundImage?.alt ?? ""}
            placeholder={backgroundImage.placeholder}
            fill
            className="object-cover group-hover:scale-125 transition-transform duration-500 ease-out"
            priority
          />
          <div
            className="absolute inset-0 bg-neutral-950"
            style={{ opacity: overlayOpacity / 100 }}
          />
        </>
      )}

      <div className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8 group-hover:scale-95 transition-transform duration-300">
        <div
          className={`flex flex-col gap-6 ${alignmentClasses[textAlignment]}`}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-200 max-w-4xl">
            {heading}
          </h1>

          {description && (
            <p className="text-lg sm:text-xl text-neutral-200/90 max-w-2xl">
              {description}
            </p>
          )}

          {secondaryCta && (
            <div className="flex flex-wrap gap-4 mt-2">
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="px-8 py-3 bg-neutral-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {secondaryCta.text}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
