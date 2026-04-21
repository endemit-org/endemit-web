"use client";

import { useEffect } from "react";

interface Props {
  targetElementId?: string;
}

export default function CheckoutSuccessConfetti({ targetElementId }: Props) {
  useEffect(() => {
    let originX = 0.5;
    let originY = 0.1;

    if (targetElementId) {
      const element = document.getElementById(targetElementId);
      if (element) {
        const rect = element.getBoundingClientRect();
        originX = (rect.left + rect.width / 2) / window.innerWidth;
        originY = (rect.top + rect.height / 2) / window.innerHeight;
      }
    }

    // Dynamic import: canvas-confetti (~33KB) only loads on success page
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 100,
        spread: 360,
        origin: { x: originX, y: originY },
      });
    });
  }, [targetElementId]);

  return null;
}
