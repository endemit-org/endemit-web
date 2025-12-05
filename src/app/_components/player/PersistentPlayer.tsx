"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/app/_stores/PlayerStore";
import CloseIcon from "@/app/_components/icon/CloseIcon";
import ChevronDownIcon from "@/app/_components/icon/ChevronDownIcon";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";

declare global {
  interface Window {
    SC: {
      Widget: {
        (iframe: HTMLIFrameElement): {
          bind(event: string, callback: () => void): void;
          unbind(event: string): void;
          play(): void;
          pause(): void;
          load(url: string, options?: { auto_play?: boolean }): void;
          getCurrentSound(
            callback: (sound: { title: string; artwork_url?: string }) => void
          ): void;
        };
        Events: {
          PLAY: string;
          PAUSE: string;
          FINISH: string;
          READY: string;
        };
      };
    };
  }
}

const COLLAPSED_HEIGHT = 48;
const EXPANDED_HEIGHT = 120;

export function PersistentPlayer() {
  const { currentTrack, isVisible, isExpanded, close, toggleExpanded } =
    usePlayerStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<ReturnType<typeof window.SC.Widget> | null>(null);

  // Load SoundCloud Widget API
  useEffect(() => {
    if (typeof window !== "undefined" && !window.SC) {
      const script = document.createElement("script");
      script.src = "https://w.soundcloud.com/player/api.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      const height = isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
      document.body.style.paddingBottom = `${height}px`;
    } else {
      document.body.style.paddingBottom = "0";
    }

    return () => {
      document.body.style.paddingBottom = "0";
    };
  }, [isVisible, isExpanded]);

  useEffect(() => {
    if (!iframeRef.current || !window.SC) return;

    const widget = window.SC.Widget(iframeRef.current);
    widgetRef.current = widget;
  }, [currentTrack]);

  useEffect(() => {
    if (currentTrack && widgetRef.current && window.SC) {
      widgetRef.current.load(currentTrack.url, { auto_play: true });
    }
  }, [currentTrack]);

  if (!isVisible || !currentTrack) return null;

  const height = isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 w-full z-20"
      style={{ height: `${height}px` }}
    >
      <div className="max-w-8xl m-auto h-full">
        <div
          className="relative h-full bg-neutral-800 border-t border-white/5 shadow-2xl transition-all duration-300  lg:ml-72 overflow-hidden lg:rounded-tr-lg"
          style={{
            backgroundImage: "url('/images/worms.png')",
            backgroundRepeat: "repeat",
            backgroundBlendMode: "multiply",
            backgroundSize: "150px",
          }}
        >
          <div
            className={
              "absolute bottom-10 h-[500px] blur-2xl -left-10 -right-10 bg-cover animate-blurred-backdrop opacity-60 @container"
            }
            style={
              currentTrack.image
                ? {
                    backgroundImage: `url(${currentTrack.image})`,
                  }
                : {}
            }
          ></div>

          <div className={`absolute inset-0 overflow-hidden flex`}>
            <div className="flex items-center gap-3 px-4 py-2 min-w-0">
              {currentTrack.image && (
                <div
                  className={`flex-shrink-0  rounded overflow-hidden bg-zinc-800 ${isExpanded ? "size-24" : "size-10"}`}
                >
                  <ImageWithFallback
                    src={currentTrack.image}
                    alt={currentTrack.title}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className={`flex-1 min-w-0 ${isExpanded ? "hidden" : ""}`}>
                <div className="text-sm font-medium text-white truncate">
                  {currentTrack.title}
                </div>
                {currentTrack.artist && (
                  <div className="text-xs text-white/50 truncate">
                    {currentTrack.artist}
                  </div>
                )}
              </div>
            </div>

            <div className={`flex-1 overflow-hidden -pr-1`}>
              <iframe
                ref={iframeRef}
                width="100%"
                height={EXPANDED_HEIGHT}
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                className={`rounded-none -m-l-[118px] w-[calc(100%+112px)] invert hue-rotate-[185deg] mix-blend-lighten -ml-[110px] -pr-[5px] ${isExpanded ? "" : "-mt-[53px] "}`}
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
                  currentTrack.url
                )}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`}
              />
            </div>
            <div className="flex gap-2 z-10 transition-opacity duration-300 p-2">
              <button
                onClick={toggleExpanded}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-sm"
                aria-label="Collapse player"
              >
                <ChevronDownIcon
                  className={`w-4 h-4 text-white/60 hover:text-white transition-transform duration-200  ${isExpanded ? "rotate-0" : "rotate-180"}`}
                />
              </button>
              <button
                onClick={close}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-sm"
                aria-label="Close player"
              >
                <CloseIcon className="w-4 h-4 text-white/60 hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
