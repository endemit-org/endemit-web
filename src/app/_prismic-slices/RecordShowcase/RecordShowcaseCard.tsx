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
 * cover; on hover it slides halfway out of the sleeve, then flips over on its
 * vertical axis (coin-toss style) while gliding back on top of the cover,
 * still spinning, and leaves the same way on hover-out. The hover-out
 * animation is only armed after the first hover so it doesn't play on page
 * load.
 *
 * The record has two faces (front + a pre-rotated back) with hidden backfaces
 * so the art reads correctly, not mirrored, once the flip lands at 180deg.
 * While the record is in front the cover shrinks and blurs a touch, delayed
 * to land as the record flips over it (~70% of the 0.525s pull).
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
      onPointerEnter={e => {
        // Mouse only: a tap on touch devices would play the pull and
        // immediately the return, which is just distracting on the way to
        // the product page.
        if (e.pointerType !== "mouse") return;
        setArmed(true);
        setHovered(true);
      }}
      onPointerLeave={e => {
        if (e.pointerType !== "mouse") return;
        setHovered(false);
      }}
    >
      <div className="relative pr-[18%] [perspective:1200px]">
        {/* Resting transform matches the 0% frame of record-pull; keyframes
            in animations.css take over once armed. preserve-3d keeps the two
            faces oriented through the rotateY flip. */}
        <div
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 right-0 w-[82%] rounded-full [transform-style:preserve-3d] ${recordAnimation}`}
        >
          {/* Front face: shown while the record is in the sleeve. */}
          <ImageWithFallback
            src={recordImage}
            alt=""
            width={400}
            height={400}
            quality={80}
            className="animate-slow-spin rounded-full w-full [backface-visibility:hidden]"
          />
          {/* Back face: pre-rotated 180deg so it reads correctly once the
              wrapper has flipped (180 + 180 = identity, spin direction too). */}
          <div className="absolute inset-0 rounded-full [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <ImageWithFallback
              src={recordImage}
              alt=""
              width={400}
              height={400}
              quality={80}
              className="animate-slow-spin rounded-full w-full [backface-visibility:hidden]"
            />
          </div>
        </div>
        <ImageWithFallback
          src={coverImage}
          alt={name}
          width={400}
          height={400}
          className={`relative z-10 w-full shadow-[0_6px_14px_rgba(0,0,0,0.5)] transition-[transform,filter] duration-300 ease-out ${
            hovered
              ? "scale-[0.94] blur-[2px] delay-[300ms]"
              : "scale-100 blur-0 delay-0"
          }`}
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
