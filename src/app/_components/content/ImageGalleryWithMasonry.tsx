"use client";

import { useState, useRef } from "react";
import { ProductImage } from "@/domain/product/types/product";
import clsx from "clsx";
import ChevronPrevIcon from "@/app/_components/icon/ChevronPrevIcon";
import ChevronNextIcon from "@/app/_components/icon/ChevronNextIcon";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import EventPoster from "@/app/_components/event/EventPoster";
import { Event } from "@/domain/event/types/event";
import Lightbox from "@/app/_components/content/Lightbox";

interface Props {
  images: ProductImage[];
  altFallbackText: string;
  relatedEvent?: Event | null;
  width?: number;
  height?: number;
}

export default function ImageGalleryWithMasonry({
  images,
  altFallbackText,
  relatedEvent,
  width = 1200,
  height = 1200,
}: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [desktopSlide, setDesktopSlide] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const desktopSliderRef = useRef<HTMLDivElement>(null);

  const scrollToSlide = (index: number) => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.offsetWidth;
      sliderRef.current.scrollTo({
        left: slideWidth * index,
        behavior: "smooth",
      });
      setCurrentSlide(index);
    }
  };

  const scrollToDesktopSlide = (index: number) => {
    if (desktopSliderRef.current) {
      const slideWidth = desktopSliderRef.current.offsetWidth;
      desktopSliderRef.current.scrollTo({
        left: slideWidth * index,
        behavior: "smooth",
      });
      setDesktopSlide(index);
    }
  };

  const handlePrevious = () => {
    const newIndex = currentSlide > 0 ? currentSlide - 1 : images.length - 1;
    scrollToSlide(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentSlide < images.length - 1 ? currentSlide + 1 : 0;
    scrollToSlide(newIndex);
  };

  const handleDesktopPrevious = () => {
    const remainingImages = images.length - 3;
    const newIndex = desktopSlide > 0 ? desktopSlide - 1 : remainingImages;
    scrollToDesktopSlide(newIndex);
  };

  const handleDesktopNext = () => {
    const remainingImages = images.length - 3;
    const newIndex = desktopSlide < remainingImages ? desktopSlide + 1 : 0;
    scrollToDesktopSlide(newIndex);
  };

  const closeLightbox = () => setLightboxIndex(null);
  const nextLightboxImage = () =>
    setLightboxIndex(prev =>
      prev !== null ? (prev + 1) % images.length : null
    );
  const prevLightboxImage = () =>
    setLightboxIndex(prev =>
      prev !== null ? (prev - 1 + images.length) % images.length : null
    );

  const hasRelatedEvent = !!relatedEvent;
  const hasSlider = images.length > 3 || (hasRelatedEvent && images.length > 1);
  const sliderImages = hasRelatedEvent
    ? images
    : hasSlider
      ? images.slice(0, -2)
      : [];
  const sideImages = hasRelatedEvent
    ? []
    : hasSlider
      ? images.slice(-2)
      : images.slice(1, 3);

  return (
    <div className="mx-auto group select-none relative">
      {/* Desktop Grid */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-8">
        {/* First Column - Single image or Slider (spans 2 columns) */}
        {hasSlider ? (
          <div className="row-span-2 col-span-2 relative">
            <div
              ref={desktopSliderRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full"
              onScroll={e => {
                const slideIndex = Math.round(
                  e.currentTarget.scrollLeft / e.currentTarget.offsetWidth
                );
                setDesktopSlide(slideIndex);
              }}
            >
              {sliderImages.map((image, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-full snap-center cursor-pointer"
                  onClick={() => setLightboxIndex(index)}
                >
                  <ImageWithFallback
                    placeholder={image.placeholder}
                    quality={95}
                    width={width}
                    height={height}
                    alt={image?.alt ?? altFallbackText}
                    src={image.src}
                    className="aspect-3/4 size-full rounded-lg object-cover"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleDesktopPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-neutral-200 text-gray-900 bg-opacity-20 text-opacity-50 group-hover:text-opacity-90 hover:scale-110 active:scale-95 group-hover:bg-opacity-50 rounded-full p-2 shadow-lg transition-all"
              aria-label="Previous image"
            >
              <ChevronPrevIcon />
            </button>
            <button
              onClick={handleDesktopNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-neutral-200 text-gray-900 bg-opacity-20 text-opacity-50 group-hover:text-opacity-90 hover:scale-110 active:scale-95 group-hover:bg-opacity-50 rounded-full p-2 shadow-lg transition-all"
              aria-label="Next image"
            >
              <ChevronNextIcon />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex justify-center gap-2">
              {sliderImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToDesktopSlide(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    desktopSlide === index
                      ? "bg-neutral-100 w-4"
                      : "bg-neutral-400 bg-opacity-70 group-hover:bg-opacity-100 transition-opacity hover:scale-125 active:scale-95"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            className={clsx(
              "row-span-2 col-span-2 cursor-pointer",
              images.length === 1 && "col-span-3"
            )}
            onClick={() => setLightboxIndex(0)}
          >
            <ImageWithFallback
              placeholder={images[0].placeholder}
              quality={95}
              width={width}
              height={height}
              alt={images[0]?.alt ?? altFallbackText}
              src={images[0].src}
              className="aspect-3/4 size-full rounded-lg object-cover"
            />
          </div>
        )}

        {/* Third Column */}
        {hasRelatedEvent ? (
          <div className="col-start-3 row-span-2">
            <EventPoster event={relatedEvent} />
          </div>
        ) : (
          <>
            {sideImages[0] && (
              <div
                className="col-start-3 cursor-pointer"
                onClick={() =>
                  setLightboxIndex(hasSlider ? images.length - 2 : 1)
                }
              >
                <ImageWithFallback
                  placeholder={sideImages[0].placeholder}
                  quality={95}
                  width={width}
                  height={height}
                  alt={sideImages[0]?.alt ?? altFallbackText}
                  src={sideImages[0].src}
                  className="aspect-3/2 size-full rounded-lg object-cover"
                />
              </div>
            )}
            {sideImages[1] && (
              <div
                className="col-start-3 row-start-2 cursor-pointer"
                onClick={() =>
                  setLightboxIndex(hasSlider ? images.length - 1 : 2)
                }
              >
                <ImageWithFallback
                  placeholder={sideImages[1].placeholder}
                  quality={95}
                  width={width}
                  height={height}
                  alt={sideImages[1]?.alt ?? altFallbackText}
                  src={sideImages[1].src}
                  className="aspect-3/2 size-full rounded-lg object-cover"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Slider */}
      <div className="lg:hidden relative">
        <div
          ref={sliderRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          onScroll={e => {
            const slideIndex = Math.round(
              e.currentTarget.scrollLeft / e.currentTarget.offsetWidth
            );
            setCurrentSlide(slideIndex);
          }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-full snap-center cursor-pointer"
              onClick={() => setLightboxIndex(index)}
            >
              <ImageWithFallback
                placeholder={image.placeholder}
                quality={95}
                width={width}
                height={height}
                alt={image?.alt ?? altFallbackText}
                src={image.src}
                className="aspect-4/5 w-full rounded-lg object-cover h-full"
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows - Only show if more than 1 image */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-neutral-200 text-gray-900 bg-opacity-20 text-opacity-50 group-hover:text-opacity-90 hover:scale-110 active:scale-95 group-hover:bg-opacity-50  rounded-full p-2 shadow-lg transition-all"
              aria-label="Previous image"
            >
              <ChevronPrevIcon />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-neutral-200 text-gray-900 bg-opacity-20 text-opacity-50 group-hover:text-opacity-90 hover:scale-110 active:scale-95 group-hover:bg-opacity-50  rounded-full p-2 shadow-lg transition-all"
              aria-label="Next image"
            >
              <ChevronNextIcon />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        <div className="-mt-6 flex justify-center gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToSlide(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                currentSlide === index
                  ? "bg-neutral-100 w-4"
                  : "bg-neutral-400 bg-opacity-70 group-hover:bg-opacity-100 transition-opacity hover:scale-125 active:scale-95"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNext={nextLightboxImage}
          onPrev={prevLightboxImage}
          onSelectIndex={setLightboxIndex}
        />
      )}
    </div>
  );
}
