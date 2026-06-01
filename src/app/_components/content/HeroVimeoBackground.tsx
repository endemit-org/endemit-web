"use client";

import { useEffect, useRef, useState } from "react";

interface HeroVimeoBackgroundProps {
  vimeoVideoId: string;
}

export default function HeroVimeoBackground({
  vimeoVideoId,
}: HeroVimeoBackgroundProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const sendCommand = (method: string) => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ method }),
        "https://player.vimeo.com",
      );
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
        sendCommand("addEventListener:play");
        sendCommand("addEventListener:playing");
      } else if (data.event === "play" || data.event === "playing") {
        setIsPlaying(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={`https://player.vimeo.com/video/${vimeoVideoId}?background=1&autoplay=1&muted=1&loop=1&playsinline=1&dnt=1`}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[max(100cqw,calc(100cqh*16/9))] h-[max(100cqh,calc(100cqw*9/16))] transition-opacity duration-700 ${
        isPlaying ? "opacity-100" : "opacity-0"
      }`}
      style={{ border: 0 }}
      allow="autoplay; fullscreen; picture-in-picture"
      loading="eager"
    />
  );
}
