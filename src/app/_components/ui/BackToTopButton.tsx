"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Show button when user has scrolled past 70% of the page
      // and there's more than 1 screen worth of content
      const scrolledPastThreshold = scrollTop > documentHeight * 0.7;
      const hasEnoughContent = documentHeight > windowHeight * 1.5;

      setIsVisible(scrolledPastThreshold && hasEnoughContent);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={clsx(
        "lg:hidden fixed bottom-20 right-4 z-40",
        "w-12 h-12 rounded-full",
        "bg-neutral-800 border border-neutral-700",
        "flex items-center justify-center",
        "shadow-lg shadow-black/30",
        "transition-all duration-300",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
      aria-label="Back to top"
    >
      <svg
        className="w-5 h-5 text-neutral-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 15l7-7 7 7"
        />
      </svg>
    </button>
  );
}
