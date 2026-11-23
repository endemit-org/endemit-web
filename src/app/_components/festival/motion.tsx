"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./festival.module.css";

/**
 * Drives the whole page's scroll motion from one listener.
 *
 * Every element marked `data-scene` gets:
 *  - `--p`: its centre relative to the viewport centre, -1 (below) to 1 (above)
 *  - `data-inview`: so looping animations run only while visible
 *
 * The root gets `data-lite` on weak devices, which switches the SVG "boil"
 * filters off (they are the only costly effect on the page).
 */
export function SceneMotion({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    const lite =
      (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) ||
      (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4) ||
      nav.connection?.saveData === true;
    if (lite) root.dataset.lite = "true";

    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-scene]"));
    const visible = new Set<HTMLElement>();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scroll speed bends the page: --v is the eased velocity (-1..1), --va its
    // size. With a mouse and a capable machine it also drives a displacement
    // filter, switched on only while the page is actually moving.
    const warp = lite || !window.matchMedia("(hover: hover) and (pointer: fine)").matches ? null : root.querySelector("#fest-warp feDisplacementMap");
    let lastY = window.scrollY;
    let velocity = 0;

    let frame = 0;
    const update = () => {
      frame = 0;
      const height = window.innerHeight;
      const y = window.scrollY;
      const target = Math.max(-1, Math.min(1, (y - lastY) / 45));
      lastY = y;
      velocity += (target - velocity) * 0.3;
      if (Math.abs(velocity) < 0.004) velocity = 0;
      for (const scene of visible) {
        const rect = scene.getBoundingClientRect();
        const centre = rect.top + rect.height / 2;
        const progress = (height / 2 - centre) / (height / 2 + rect.height / 2);
        scene.style.setProperty("--p", Math.max(-1, Math.min(1, progress)).toFixed(4));
        scene.style.setProperty("--v", velocity.toFixed(3));
        scene.style.setProperty("--va", Math.abs(velocity).toFixed(3));
      }
      if (warp) {
        const warping = Math.abs(velocity) > 0.03;
        warp.setAttribute("scale", (Math.abs(velocity) * 30).toFixed(1));
        if ((root.dataset.warping === "true") !== warping) root.dataset.warping = String(warping);
      }
      // Keep drawing until the bend has eased back to rest.
      if (velocity !== 0) frame = requestAnimationFrame(update);
    };
    const schedule = () => {
      if (!frame && !reduced) frame = requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const scene = entry.target as HTMLElement;
          scene.dataset.inview = String(entry.isIntersecting);
          if (entry.isIntersecting) visible.add(scene);
          else {
            visible.delete(scene);
            scene.style.setProperty("--v", "0");
            scene.style.setProperty("--va", "0");
          }
        }
        schedule();
      },
      { rootMargin: "10% 0px" }
    );
    scenes.forEach(scene => observer.observe(scene));

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [rootId]);

  return null;
}

/** Silent looping clip. Loads and plays only while on screen. */
export function LoopVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!video.src) video.src = src;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "20% 0px" }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  return <video ref={ref} poster={poster} muted loop playsInline preload="none" aria-label={label} />;
}

function useDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const show = () => {
    setOpen(true);
    ref.current?.showModal();
  };
  const close = () => ref.current?.close();
  return { ref, open, show, close, onClose: () => setOpen(false) };
}

export function FilmPlayer({
  src,
  poster,
  loop,
  playLabel,
  closeLabel,
}: {
  src: string;
  poster: string;
  loop: { src: string; poster: string };
  playLabel: string;
  closeLabel: string;
}) {
  const dialog = useDialog();
  return (
    <>
      <button type="button" className={`${styles.filmPoster} ${styles.jitter}`} onClick={dialog.show} aria-label={playLabel}>
        <LoopVideo src={loop.src} poster={loop.poster} label="" />
        <span className={styles.filmPlay} aria-hidden>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 3.5v17l15-8.5z" />
          </svg>
        </span>
      </button>
      <dialog ref={dialog.ref} className={styles.dialog} onClose={dialog.onClose}>
        <button type="button" className={`${styles.tag} ${styles.dialogClose}`} onClick={dialog.close}>
          {closeLabel}
        </button>
        <div className={styles.dialogBody}>
          {dialog.open && <video src={src} poster={poster} controls autoPlay playsInline />}
        </div>
      </dialog>
    </>
  );
}

export function MapViewer({
  src,
  alt,
  width,
  height,
  openLabel,
  closeLabel,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  openLabel: string;
  closeLabel: string;
}) {
  const dialog = useDialog();
  return (
    <>
      <button type="button" className={`${styles.mapButton} ${styles.jitter}`} onClick={dialog.show} aria-label={openLabel}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      </button>
      <dialog ref={dialog.ref} className={styles.dialog} onClose={dialog.onClose}>
        <button type="button" className={`${styles.tag} ${styles.dialogClose}`} onClick={dialog.close}>
          {closeLabel}
        </button>
        <div className={styles.dialogBody}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {dialog.open && <img src={src} alt={alt} width={width} height={height} />}
        </div>
      </dialog>
    </>
  );
}

/** Ambient forest sound. Off until the visitor turns it on. */
export function SoundToggle({ onLabel, offLabel }: { onLabel: string; offLabel: string }) {
  const [enabled, setEnabled] = useState(false);
  const engine = useRef<import("./soundscape").ForestSoundscape | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      engine.current?.setProgress(max > 0 ? window.scrollY / max : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled]);

  useEffect(() => () => engine.current?.dispose(), []);

  const toggle = async () => {
    const next = !enabled;
    if (next && !engine.current) {
      const { ForestSoundscape } = await import("./soundscape");
      engine.current = new ForestSoundscape();
    }
    await engine.current?.setEnabled(next);
    setEnabled(next);
  };

  return (
    <button type="button" className={styles.sound} aria-pressed={enabled} aria-label={enabled ? onLabel : offLabel} onClick={toggle}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
        {enabled ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="M17 9l5 6M22 9l-5 6" />}
      </svg>
    </button>
  );
}

/** Fixed strip of section links; shows once the hero is scrolled past. */
export function SectionNav({ label, items }: { label: string; items: { id: string; label: string }[] }) {
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState("");
  const strip = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      let current = "";
      for (const item of items) {
        const top = document.getElementById(item.id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= line) current = item.id;
      }
      setActive(current);
      setShown(window.scrollY > window.innerHeight * 0.55);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  // Keep the active link visible when the strip overflows on a phone.
  useEffect(() => {
    const bar = strip.current;
    const link = bar?.querySelector<HTMLElement>('[aria-current="true"]');
    if (bar && link) bar.scrollTo({ left: link.offsetLeft - (bar.clientWidth - link.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  return (
    <nav ref={strip} className={styles.nav} aria-label={label} data-shown={shown} inert={!shown}>
      {items.map(item => (
        <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? "true" : undefined}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
