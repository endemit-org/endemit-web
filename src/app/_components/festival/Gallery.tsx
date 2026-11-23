"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import type { FestivalPhoto } from "./photos";
import styles from "./festival.module.css";

const ART = "/images/festival/2027";

/**
 * Full-screen photo wall. Any element with `data-gallery` opens it; when the
 * attribute names a photo, the wall opens scrolled to that photo.
 */
export default function Gallery({
  photos,
  labels,
}: {
  photos: FestivalPhoto[];
  labels: { title: string; close: string; previous: string; next: string };
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [zoom, setZoom] = useState<number | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const trigger = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-gallery]");
      if (!trigger || dialog.current?.contains(trigger)) return;
      event.preventDefault();
      setTarget(trigger.dataset.gallery ?? "");
      setZoom(null);
      setOpen(true);
      dialog.current?.showModal();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Bring the photo that was tapped into view once the wall is rendered.
  useEffect(() => {
    if (!open || !target) return;
    dialog.current?.querySelector(`[data-photo="${target}"]`)?.scrollIntoView({ block: "center" });
  }, [open, target]);

  const step = useCallback(
    (by: number) => setZoom(current => (current === null ? current : (current + by + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (zoom === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, step]);

  const zoomed = zoom === null ? null : photos[zoom];

  return (
    <dialog
      ref={dialog}
      className={`${styles.dialog} ${styles.gallery}`}
      aria-label={labels.title}
      onCancel={event => {
        // Escape first leaves the enlarged photo, then the wall.
        if (zoom !== null) {
          event.preventDefault();
          setZoom(null);
        }
      }}
      onClose={() => {
        setOpen(false);
        setZoom(null);
      }}
    >
      <button type="button" className={`${styles.tag} ${styles.dialogClose}`} onClick={() => (zoom === null ? dialog.current?.close() : setZoom(null))}>
        {labels.close}
      </button>
      {open ? (
        <div className={styles.wall}>
          {photos.map((item, index) => (
            <button key={item.slug} type="button" data-photo={item.slug} data-target={item.slug === target} onClick={() => setZoom(index)}>
              <img
                src={`${ART}/photo-${item.slug}-640.webp`}
                srcSet={`${ART}/photo-${item.slug}-640.webp 640w, ${ART}/photo-${item.slug}.webp ${item.w}w`}
                sizes="(max-width: 700px) 50vw, (max-width: 1100px) 34vw, 25vw"
                width={item.w}
                height={item.h}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      ) : null}
      {zoomed ? (
        <div className={styles.zoom} onClick={() => setZoom(null)}>
          <img key={zoomed.slug} src={`${ART}/photo-${zoomed.slug}.webp`} width={zoomed.w} height={zoomed.h} alt="" />
          <div className={styles.zoomNav} onClick={event => event.stopPropagation()}>
            <button type="button" className={styles.tag} onClick={() => step(-1)} aria-label={labels.previous}>
              ←
            </button>
            <button type="button" className={styles.tag} onClick={() => step(1)} aria-label={labels.next}>
              →
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
