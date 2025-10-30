"use client";

import { useEffect, useRef } from "react";
import ChevronPrevIcon from "@/app/_components/icon/ChevronPrevIcon";
import ChevronNextIcon from "@/app/_components/icon/ChevronNextIcon";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";

interface LightboxProps {
  images: Array<{
    src: string;
    alt?: string;
    caption?: string;
    placeholder?: string;
  }>;
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectIndex: (index: number) => void;
}

export default function Lightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onSelectIndex,
}: LightboxProps) {
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    if (thumbnailsRef.current) {
      const thumbnail = thumbnailsRef.current.children[
        currentIndex
      ] as HTMLElement;
      if (thumbnail) {
        thumbnail.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentIndex]);

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-neutral-200 text-4xl hover:text-gray-300 transition-colors z-10"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        &times;
      </button>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-neutral-200 text-gray-900 bg-opacity-20 text-opacity-50 hover:text-opacity-90 hover:scale-110 active:scale-95 hover:bg-opacity-50 rounded-full p-2 shadow-lg transition-all z-10"
            onClick={e => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous image"
          >
            <ChevronPrevIcon />
          </button>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-neutral-200 text-gray-900 bg-opacity-20 text-opacity-50 hover:text-opacity-90 hover:scale-110 active:scale-95 hover:bg-opacity-50 rounded-full p-2 shadow-lg transition-all z-10"
            onClick={e => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next image"
          >
            <ChevronNextIcon />
          </button>
        </>
      )}

      <div
        className="flex-1 flex items-center justify-center max-w-5xl w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative max-h-[calc(90vh-120px)]">
          <ImageWithFallback
            src={currentImage.src}
            alt={currentImage.alt ?? ""}
            width={1200}
            height={900}
            className="max-h-[calc(90vh-120px)] w-auto object-contain"
            placeholder={currentImage.placeholder}
            quality={95}
          />
          {currentImage.caption && (
            <p className="text-neutral-200 text-center mt-4 text-lg">
              {currentImage.caption}
            </p>
          )}
        </div>
      </div>

      {images.length > 1 && (
        <div
          className="w-full max-w-5xl mt-4 pb-2"
          onClick={e => e.stopPropagation()}
        >
          <div
            ref={thumbnailsRef}
            className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-transparent px-2 pb-2"
          >
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => onSelectIndex(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${
                  currentIndex === index
                    ? "ring-2 ring-neutral-100 opacity-100"
                    : "opacity-50 hover:opacity-75"
                }`}
                aria-label={`View image ${index + 1}`}
              >
                <ImageWithFallback
                  src={image.src}
                  alt={image.alt ?? ""}
                  placeholder={image.placeholder}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
          <p className="text-neutral-400 text-center mt-2 text-sm">
            {currentIndex + 1} / {images.length}
          </p>
        </div>
      )}
    </div>
  );
}
