"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function CheckoutSuccessConfetti() {
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 360,
      origin: { y: 0.1 },
    });
  }, []);
  return "";
}
