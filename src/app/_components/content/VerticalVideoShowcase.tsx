"use client";

import {
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface VerticalVideoShowcaseProps {
  vimeoVideoId: string;
  /** Pre-sized poster URL shown until the preview iframe paints. */
  poster?: { src: string; alt: string } | null;
  /** When set, the whole slice is a link (Hero-style), except the player. */
  href?: string | null;
  /** Server-rendered text column, shown beside the video on desktop. */
  children?: ReactNode;
  /**
   * Server-rendered text overlaid on the video's bottom edge on mobile; it
   * navigates to `href` when tapped. Once the inline player is running it
   * moves below the video so it neither covers the controls nor disappears.
   */
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
 * The site declares `color-scheme: dark` globally (Samsung workaround). Per
 * spec an iframe whose document's color-scheme differs from the one used on
 * the iframe element gets an opaque *white* canvas behind it — that is the
 * white flash while Vimeo boots. Vimeo's embed page is light-scheme, so
 * matching it here keeps the backdrop transparent and our dark surface shows
 * through until the player paints.
 */
const IFRAME_STYLE = { border: 0, colorScheme: "light" } as const;

type VimeoEvent = "play" | "pause" | "seeked" | "timeupdate";
type VimeoMessage = {
  event?: string;
  method?: string;
  data?: { seconds?: number };
  value?: unknown;
};

function postToPlayer(
  iframe: HTMLIFrameElement | null,
  method: string,
  value?: unknown
) {
  iframe?.contentWindow?.postMessage(
    JSON.stringify(value === undefined ? { method } : { method, value }),
    PLAYER_ORIGIN
  );
}

/**
 * Subscribes to a Vimeo iframe's player events over the postMessage API
 * (no SDK). Subscriptions are (re)sent on iframe load and again on the
 * player's own `ready` — the earlier of the two is sometimes too early.
 */
function useVimeoEvents(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  events: readonly VimeoEvent[],
  onEvent: (event: string, data: VimeoMessage["data"]) => void
) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  const subscribe = useCallback(() => {
    for (const event of events) {
      postToPlayer(iframeRef.current, "addEventListener", event);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iframeRef, events.join(",")]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const iframe = iframeRef.current;
      if (
        e.origin !== PLAYER_ORIGIN ||
        !iframe ||
        e.source !== iframe.contentWindow
      ) {
        return;
      }
      let msg: VimeoMessage;
      try {
        msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (!msg || typeof msg !== "object" || !msg.event) return;
      if (msg.event === "ready") subscribe();
      handlerRef.current(msg.event, msg.data);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [iframeRef, subscribe]);

  return subscribe;
}

/**
 * Vertical 9:16 Vimeo showcase. The video previews as a muted, controls-free
 * loop once the slice nears the viewport. On desktop the loop also feeds a
 * blurred, scaled "ambilight" layer behind the whole slice, and clicking play
 * swaps the preview for the real player (sound + controls) in place — on
 * every viewport. Once the real player runs, the ambilight follows it
 * (play/pause/seek/time) so the glow matches what's on screen. On mobile the
 * text overlays the video like the Hero and links to the CTA target.
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
  const previewRef = useRef<HTMLIFrameElement>(null);
  const ambilightRef = useRef<HTMLIFrameElement>(null);
  const watchRef = useRef<HTMLIFrameElement>(null);
  const ambilightTime = useRef(0);
  const [inView, setInView] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [ambilightPlaying, setAmbilightPlaying] = useState(false);
  const [watchPlaying, setWatchPlaying] = useState(false);
  const [inlinePlayer, setInlinePlayer] = useState(false);

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

  // Each iframe stays invisible until its player reports it's actually
  // playing — `onLoad` fires long before the first frame paints.
  const subscribePreview = useVimeoEvents(previewRef, ["play"], event => {
    if (event === "play") setPreviewPlaying(true);
  });
  const subscribeAmbilight = useVimeoEvents(
    ambilightRef,
    ["play", "timeupdate"],
    (event, data) => {
      if (event === "play") setAmbilightPlaying(true);
      if (event === "timeupdate" && typeof data?.seconds === "number") {
        ambilightTime.current = data.seconds;
      }
    }
  );
  // Drive the ambilight from the real player: mirror play/pause/seek and
  // nudge its clock whenever it drifts more than half a second.
  const subscribeWatch = useVimeoEvents(
    watchRef,
    ["play", "pause", "seeked", "timeupdate"],
    (event, data) => {
      const bg = ambilightRef.current;
      const seconds = data?.seconds;
      if (event === "play") {
        setWatchPlaying(true);
        if (typeof seconds === "number") {
          postToPlayer(bg, "setCurrentTime", seconds);
        }
        postToPlayer(bg, "play");
      } else if (event === "pause") {
        postToPlayer(bg, "pause");
      } else if (event === "seeked" && typeof seconds === "number") {
        postToPlayer(bg, "setCurrentTime", seconds);
      } else if (event === "timeupdate" && typeof seconds === "number") {
        if (Math.abs(ambilightTime.current - seconds) > 0.5) {
          postToPlayer(bg, "setCurrentTime", seconds);
          ambilightTime.current = seconds;
        }
      }
    }
  );

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

  const handlePlay = (e: React.MouseEvent) => {
    // The slice may be one big link — playing must not navigate.
    e.preventDefault();
    e.stopPropagation();
    setInlinePlayer(true);
  };

  const showAmbilight = isDesktop && inView;
  const fade = (visible: boolean) =>
    `transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`;

  const inner = (
    <>
      {/* Ambilight: the same muted loop, scaled to cover and heavily blurred. */}
      {showAmbilight && (
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden pointer-events-none [container-type:size]"
        >
          <div
            className={`absolute inset-0 blur-2xl saturate-150 opacity-50 scale-110 ${fade(
              ambilightPlaying
            )}`}
          >
            <iframe
              ref={ambilightRef}
              src={previewSrc}
              onLoad={subscribeAmbilight}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[max(100cqw,calc(100cqh*9/16))] h-[max(100cqh,calc(100cqw*16/9))]"
              style={IFRAME_STYLE}
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
              ref={watchRef}
              src={watchSrc}
              onLoad={subscribeWatch}
              className={`absolute inset-0 w-full h-full ${fade(watchPlaying)}`}
              style={IFRAME_STYLE}
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
                  ref={previewRef}
                  src={previewSrc}
                  onLoad={subscribePreview}
                  className={`absolute inset-0 w-full h-full ${fade(
                    previewPlaying
                  )}`}
                  style={IFRAME_STYLE}
                  allow="autoplay"
                  tabIndex={-1}
                />
              )}
              {/* Sits above the play-capture button: the gradient lets taps
                  through to play, the text block itself navigates (it is
                  inside the slice link). */}
              {overlay && (
                <div className="md:hidden absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-neutral-950/90 via-neutral-950/50 to-transparent px-4 pb-4 pt-16 pointer-events-none">
                  <div className="pointer-events-auto">{overlay}</div>
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

        {/* Mobile, while playing: the overlay would cover the player's
            controls, so the text moves under the video instead. */}
        {inlinePlayer && overlay && (
          <div className="md:hidden w-full max-w-sm mx-auto">{overlay}</div>
        )}
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
    </div>
  );
}
