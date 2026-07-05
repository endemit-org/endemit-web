"use client";

import { useState } from "react";
import Lightbox from "@/app/_components/content/Lightbox";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import { prismicImageLoader } from "@/lib/util/prismicImageLoader";

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  placeholder?: string;
}

export interface ImageGalleryProps {
  heading?: string;
  images: GalleryImage[];
  layout?: "grid" | "masonry";
  columns?: "2" | "3" | "4";
}

export default function ImageGalleryWithLightbox({
  heading,
  images,
  layout = "grid",
  columns = "3",
}: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const columnClasses = {
    "2": "grid-cols-2",
    "3": "grid-cols-2 lg:grid-cols-3",
    "4": "grid-cols-2 lg:grid-cols-4",
  };

  const masonryColumnClasses = {
    "2": "columns-2",
    "3": "columns-2 lg:columns-3",
    "4": "columns-2 lg:columns-4",
  };

  // Per-tile width budget: 50vw on mobile (2 columns), then split by column count.
  const sizesByColumns: Record<"2" | "3" | "4", string> = {
    "2": "50vw",
    "3": "(min-width: 1024px) 33vw, 50vw",
    "4": "(min-width: 1024px) 25vw, 50vw",
  };
  const tileSizes = sizesByColumns[columns];

  const closeLightbox = () => setLightboxIndex(null);
  const nextImage = () =>
    setLightboxIndex(prev =>
      prev !== null ? (prev + 1) % images.length : null
    );
  const prevImage = () =>
    setLightboxIndex(prev =>
      prev !== null ? (prev - 1 + images.length) % images.length : null
    );

  return (
    <div className="w-full">
      {heading && (
        <h2 className="text-3xl font-bold mb-8 text-neutral-200">{heading}</h2>
      )}

      {layout === "grid" ? (
        <div className={`grid ${columnClasses[columns]} gap-4`}>
          {images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => setLightboxIndex(index)}
            >
              <ImageWithFallback
                src={image.src}
                alt={image.alt}
                fill
                sizes={tileSizes}
                placeholder={image.placeholder}
                loader={prismicImageLoader}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {image.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-neutral-200 text-sm">{image.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`${masonryColumnClasses[columns]} gap-4 space-y-4`}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="relative break-inside-avoid mb-4 overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => setLightboxIndex(index)}
            >
              <ImageWithFallback
                src={image.src}
                alt={image.alt}
                width={800}
                height={600}
                sizes={tileSizes}
                placeholder={image.placeholder}
                loader={prismicImageLoader}
                className="w-full transition-transform duration-300 group-hover:scale-105"
              />
              {image.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-neutral-200 text-sm">{image.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNext={nextImage}
          onPrev={prevImage}
          onSelectIndex={setLightboxIndex}
        />
      )}
    </div>
  );
}
