"use client";
import { useEffect, useRef, useState } from "react";
import s from "./journey.module.css";

/** Silent documentary loops. No offscreen playback or preload of the whole path. */
export default function JourneyMedia({
  clip,
  caption,
  locale,
  motion,
  blocked = false,
  wide = false,
}: {
  clip: "forest" | "dance" | "lights" | "signal";
  caption: string;
  locale: "sl" | "en";
  motion: boolean;
  blocked?: boolean;
  wide?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [requested, setRequested] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const sync = () => {
      if (
        visible &&
        motion &&
        !blocked &&
        !manualPause &&
        !document.hidden &&
        (!connection?.saveData || requested)
      ) {
        setLoaded(true);
        if (element.getAttribute("src"))
          void element.play().catch(() => setPlaying(false));
      } else element.pause();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      element.pause();
    };
  }, [visible, motion, blocked, manualPause, loaded, requested]);
  return (
    <figure className={`${s.movingImage} ${wide ? s.wide : ""}`}>
      <video
        ref={video}
        src={loaded ? `/images/festival/motion/${clip}.mp4` : undefined}
        poster={`/images/festival/motion/${clip}.jpg`}
        muted
        loop
        playsInline
        preload="none"
        aria-label={caption}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <figcaption>
        <span>{caption}</span>
        <span aria-hidden="true">↗</span>
      </figcaption>
      {motion && (
        <button
          type="button"
          className={s.videoToggle}
          aria-label={`${playing ? (locale === "sl" ? "Ustavi posnetek" : "Pause clip") : locale === "sl" ? "Predvajaj posnetek" : "Play clip"}: ${caption}`}
          onClick={() => {
            if (playing) setManualPause(true);
            else {
              setRequested(true);
              setManualPause(false);
              setLoaded(true);
              void video.current?.play().catch(() => {});
            }
          }}
        >
          {playing ? "Ⅱ" : "▷"}
        </button>
      )}
    </figure>
  );
}
