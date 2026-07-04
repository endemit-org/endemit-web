"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface HeroVimeoBackgroundProps {
  vimeoVideoId: string;
}

export default function HeroVimeoBackground({
  vimeoVideoId,
}: HeroVimeoBackgroundProps) {
  const t = useTranslations("common");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Mirror in a ref so the postMessage listener can apply the latest mute
  // state on `ready` without re-binding.
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const sendCommand = (method: string, value?: unknown) => {
      iframe.contentWindow?.postMessage(
        JSON.stringify(value !== undefined ? { method, value } : { method }),
        "https://player.vimeo.com",
      );
    };

    const subscribe = () => {
      sendCommand("addEventListener", "play");
      sendCommand("addEventListener", "playing");
      sendCommand("addEventListener", "timeupdate");
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://player.vimeo.com") return;
      if (event.source !== iframe.contentWindow) return;

      let data: { event?: string };
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      if (data.event === "ready") {
        subscribe();
        setIsReady(true);
        sendCommand("setMuted", isMutedRef.current);
      } else if (
        data.event === "play" ||
        data.event === "playing" ||
        data.event === "timeupdate"
      ) {
        setIsPlaying(true);
      }
    };

    const handleLoad = () => subscribe();

    window.addEventListener("message", handleMessage);
    iframe.addEventListener("load", handleLoad);

    return () => {
      window.removeEventListener("message", handleMessage);
      iframe.removeEventListener("load", handleLoad);
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.contentWindow?.postMessage(
      JSON.stringify({ method: "setMuted", value: isMuted }),
      "https://player.vimeo.com",
    );
  }, [isMuted, isReady]);

  return (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none group-hover:scale-125 group-hover:rotate-12 group-hover:blur-sm transition-all !duration-500 ease-out [container-type:size]">
        <iframe
          ref={iframeRef}
          src={`https://player.vimeo.com/video/${vimeoVideoId}?controls=0&title=0&byline=0&portrait=0&autoplay=1&muted=1&loop=1&playsinline=1&dnt=1`}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[max(100cqw,calc(100cqh*16/9))] h-[max(100cqh,calc(100cqw*9/16))] transition-opacity duration-700 ${
            isPlaying ? "opacity-100" : "opacity-0"
          }`}
          style={{ border: 0 }}
          allow="autoplay; fullscreen; picture-in-picture"
          loading="eager"
        />
      </div>
      {isPlaying && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMuted((m) => !m);
          }}
          aria-label={isMuted ? t("a11y.unmuteVideo") : t("a11y.muteVideo")}
          className="absolute top-4 right-4 z-30 backdrop-blur-lg border border-neutral-700 p-2 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-900/40 transition-colors"
        >
          {isMuted ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
              />
            </svg>
          )}
        </button>
      )}
    </>
  );
}
