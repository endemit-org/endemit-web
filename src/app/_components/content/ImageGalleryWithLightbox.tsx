"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "@/app/_components/content/Lightbox";

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
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
    "2": "grid-cols-1 md:grid-cols-2",
    "3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    "4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  const masonryColumnClasses = {
    "2": "md:columns-2",
    "3": "md:columns-2 lg:columns-3",
    "4": "md:columns-2 lg:columns-4",
  };

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
              <Image
                src={image.src}
                alt={image.alt}
                fill
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
          className={`columns-1 ${masonryColumnClasses[columns]} gap-4 space-y-4`}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="relative break-inside-avoid mb-4 overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => setLightboxIndex(index)}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={800}
                height={600}
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
