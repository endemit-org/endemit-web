"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ModalPortal from "@/app/_components/ui/ModalPortal";

interface VerticalVideoShowcaseProps {
  vimeoVideoId: string;
  /** Pre-sized poster URL shown until the preview iframe paints. */
  poster?: { src: string; alt: string } | null;
  /** When set, the whole slice is a link (Hero-style), except the player. */
  href?: string | null;
  /** Server-rendered text column, shown beside the video on desktop. */
  children?: ReactNode;
  /** Server-rendered text overlaid on the video's bottom edge on mobile. */
  overlay?: ReactNode;
}

const PLAYER_ORIGIN = "https://player.vimeo.com";

function playerSrc(id: string, params: Record<string, string>) {
  const query = new URLSearchParams({
    title: "0",
    byline: "0",
    portrait: "0",
    playsinline: "1",
    dnt: "1",
    ...params,
  });
  return `${PLAYER_ORIGIN}/video/${id}?${query.toString()}`;
}

/**
 * Vertical 9:16 Vimeo showcase. The video previews as a muted, controls-free
 * loop once the slice nears the viewport. On desktop the loop also feeds a
 * blurred, scaled "ambilight" layer behind the whole slice, and clicking play
 * swaps the preview for the real player (sound + controls) in place. On
 * mobile, play opens a fullscreen modal player instead — 9:16 inline is too
 * cramped there — and the text overlays the video like the Hero.
 */
export default function VerticalVideoShowcase({
  vimeoVideoId,
  poster,
  href,
  children,
  overlay,
}: VerticalVideoShowcaseProps) {
  const t = useTranslations("common");
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [inlinePlayer, setInlinePlayer] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const previewSrc = playerSrc(vimeoVideoId, {
    controls: "0",
    autoplay: "1",
    muted: "1",
    loop: "1",
    autopause: "0",
  });
  const watchSrc = playerSrc(vimeoVideoId, {
    controls: "1",
    autoplay: "1",
    muted: "0",
  });

  // Lazy-mount the iframes only once the slice nears the viewport.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The ambilight layer is desktop-only; gate it in JS (not CSS) so mobile
  // never pays for the second iframe.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen]);

  const handlePlay = (e: React.MouseEvent) => {
    // The slice may be one big link — playing must not navigate.
    e.preventDefault();
    e.stopPropagation();
    if (window.matchMedia("(min-width: 768px)").matches) {
      setInlinePlayer(true);
    } else {
      setModalOpen(true);
    }
  };

  const showAmbilight = isDesktop && inView;

  const inner = (
    <>
      {/* Ambilight: the same muted loop, scaled to cover and heavily blurred. */}
      {showAmbilight && (
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden pointer-events-none [container-type:size]"
        >
          <div className="absolute inset-0 blur-2xl saturate-150 opacity-50 scale-110">
            <iframe
              src={previewSrc}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[max(100cqw,calc(100cqh*9/16))] h-[max(100cqh,calc(100cqw*16/9))]"
              style={{ border: 0 }}
              allow="autoplay"
              tabIndex={-1}
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-neutral-950/40" />
        </div>
      )}

      {/* Hero-style hover cue: the white frame scales in when linked. */}
      {href && (
        <div className="absolute inset-0 border-[20px] border-neutral-100 scale-125 group-hover:scale-100 transition-transform duration-300 pointer-events-none z-30 hidden md:block" />
      )}

      <div
        className={`relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-12 md:py-16 grid gap-8 md:gap-12 items-center ${
          children ? "md:grid-cols-2" : "justify-items-center"
        }`}
      >
        {children}

        <div className="relative w-full max-w-sm md:max-w-[360px] mx-auto aspect-[9/16] overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/10 shadow-2xl">
          {inlinePlayer ? (
            <iframe
              src={watchSrc}
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              {poster && (
                /* vimeocdn thumbnails aren't in the next/image allowlist;
                   the server already sends a right-sized URL. */
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={poster.src}
                  alt={poster.alt}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              {inView && (
                <iframe
                  src={previewSrc}
                  onLoad={() => setPreviewLoaded(true)}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
                    previewLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ border: 0 }}
                  allow="autoplay"
                  tabIndex={-1}
                />
              )}
              {/* Sits above the play-capture button so the CTA cue (the only
                  pointer-events-auto child) navigates instead of playing. */}
              {overlay && (
                <div className="md:hidden absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-neutral-950/90 via-neutral-950/50 to-transparent px-4 pb-4 pt-16 pointer-events-none">
                  {overlay}
                </div>
              )}
              <button
                type="button"
                onClick={handlePlay}
                aria-label={t("a11y.playVideo")}
                className="group/play absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-950/60 backdrop-blur-md ring-1 ring-white/30 text-neutral-100 transition-transform duration-300 group-hover/play:scale-110">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-7 h-7 translate-x-0.5"
                    aria-hidden="true"
                  >
                    <path d="M8 5.14v13.72c0 .86.94 1.39 1.68.94l11.02-6.86a1.1 1.1 0 0 0 0-1.88L9.68 4.2A1.1 1.1 0 0 0 8 5.14Z" />
                  </svg>
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );

  const rootClassName =
    "group relative block overflow-hidden bg-neutral-950 border-8 border-neutral-950";

  return (
    <div ref={rootRef}>
      {href ? (
        <Link href={href} className={rootClassName}>
          {inner}
        </Link>
      ) : (
        <div className={rootClassName}>{inner}</div>
      )}

      {modalOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <button
              type="button"
              className="absolute top-4 right-4 z-10 text-neutral-200 text-4xl hover:text-gray-300 transition-colors"
              onClick={() => setModalOpen(false)}
              aria-label={t("a11y.closeVideo")}
            >
              &times;
            </button>
            <div
              className="relative aspect-[9/16] h-full max-h-[calc(100dvh-4rem)] max-w-full"
              onClick={e => e.stopPropagation()}
            >
              <iframe
                src={watchSrc}
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
