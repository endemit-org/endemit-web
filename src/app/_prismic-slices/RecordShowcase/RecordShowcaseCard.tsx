"use client";

import React, { FC, useState } from "react";
import { Link } from "@/i18n/navigation";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";

type Props = {
  href: string;
  name: string;
  price: string;
  statusText: string | null;
  coverImage: string;
  recordImage: string;
  /** Stacking order: earlier cards sit above later ones so the record can
   *  overflow onto the next card's cover instead of under it. */
  zIndex: number;
};

/**
 * One release in the RecordShowcase grid. The record peeks out from behind the
 * cover; on hover it slides fully out of the sleeve, then comes back on top of
 * the cover (still spinning), and leaves the same way on hover-out. The
 * hover-out animation is only armed after the first hover so it doesn't play
 * on page load.
 */
const RecordShowcaseCard: FC<Props> = ({
  href,
  name,
  price,
  statusText,
  coverImage,
  recordImage,
  zIndex,
}) => {
  const [hovered, setHovered] = useState(false);
  const [armed, setArmed] = useState(false);

  const recordAnimation = !armed
    ? ""
    : hovered
      ? "animate-record-pull"
      : "animate-record-return";

  return (
    <Link
      href={href}
      className="group block relative"
      style={{ zIndex }}
      onPointerEnter={() => {
        setArmed(true);
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <div className="relative pr-[18%]">
        {/* Resting transform matches the 0% frame of record-pull; keyframes
            in animations.css take over once armed. */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 right-0 w-[82%] ${recordAnimation}`}
        >
          <ImageWithFallback
            src={recordImage}
            alt=""
            width={400}
            height={400}
            quality={80}
            className="animate-slow-spin rounded-full w-full"
          />
        </div>
        <ImageWithFallback
          src={coverImage}
          alt={name}
          width={400}
          height={400}
          className="relative z-10 w-full shadow-[0_6px_14px_rgba(0,0,0,0.5)]"
        />
        {statusText && (
          <span className="absolute z-30 top-3 left-3 bg-neutral-950/80 backdrop-blur-sm text-neutral-200 text-xs uppercase tracking-wider font-heading px-2 py-1 rounded">
            {statusText}
          </span>
        )}
      </div>

      <div className="mt-4 pr-[18%]">
        <div className="text-neutral-200 text-lg group-hover:text-neutral-400 transition-colors">
          {name}
        </div>
        <div className="text-neutral-500 text-sm">{price}</div>
      </div>
    </Link>
  );
};

export default RecordShowcaseCard;
