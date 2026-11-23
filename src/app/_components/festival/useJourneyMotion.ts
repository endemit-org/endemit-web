"use client";
import { useEffect, type RefObject } from "react";

/** Scroll writes transforms to visible scene layers; no perpetual render loop. */
export function useJourneyMotion(
  root: RefObject<HTMLDivElement | null>,
  motion: boolean
) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let frame = 0,
      pointerFrame = 0;
    const regions = Array.from(
      element.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    const update = () => {
      frame = 0;
      const viewport = innerHeight;
      element.style.setProperty(
        "--travel",
        String(scrollY / Math.max(1, element.scrollHeight - viewport))
      );
      for (const region of regions) {
        const bounds = region.getBoundingClientRect();
        if (bounds.bottom < -viewport || bounds.top > viewport * 2) continue;
        const opening =
          region.dataset.reveal === "arrival"
            ? Math.max(
                0,
                Math.min(1, -bounds.top / Math.max(1, bounds.height - viewport))
              )
            : Math.max(
                0,
                Math.min(1, (viewport * 0.85 - bounds.top) / (viewport * 0.95))
              );
        region.style.setProperty("--opening", String(motion ? opening : 1));
      }
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const pointer = (event: PointerEvent) => {
      if (!motion || event.pointerType !== "mouse") return;
      cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        element.style.setProperty(
          "--look-x",
          String((event.clientX / innerWidth - 0.5) * 2)
        );
        element.style.setProperty(
          "--look-y",
          String((event.clientY / innerHeight - 0.5) * 2)
        );
      });
    };
    update();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    element.addEventListener("pointermove", pointer, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pointerFrame);
      removeEventListener("scroll", queue);
      removeEventListener("resize", queue);
      element.removeEventListener("pointermove", pointer);
    };
  }, [root, motion]);
}
