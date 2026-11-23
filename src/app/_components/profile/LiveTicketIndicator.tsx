"use client";

import { useState, useEffect } from "react";
import { useFormatter } from "next-intl";

interface LiveTicketIndicatorProps {
  ticketHash: string;
  /** Overrides the default light-on-dark text color. */
  className?: string;
}

export default function LiveTicketIndicator({
  ticketHash,
  className = "text-white/70 mt-6",
}: LiveTicketIndicatorProps) {
  const format = useFormatter();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [hashFragment, setHashFragment] = useState<string>("");

  useEffect(() => {
    // Update time every second
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        format.dateTime(now, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    return () => clearInterval(timeInterval);
  }, [format]);

  useEffect(() => {
    // Generate random hash fragment every 3 seconds
    const generateHashFragment = () => {
      const chars = "ABCDEF0123456789";
      const hashChars = ticketHash.toUpperCase().slice(0, 32);

      // Mix real hash characters with random positions
      let fragment = "";
      for (let i = 0; i < 8; i++) {
        const useReal = Math.random() > 0.3;
        if (useReal && hashChars[i]) {
          fragment += hashChars[Math.floor(Math.random() * hashChars.length)];
        } else {
          fragment += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      setHashFragment(fragment);
    };

    generateHashFragment();
    const hashInterval = setInterval(generateHashFragment, 3000);

    return () => clearInterval(hashInterval);
  }, [ticketHash]);

  if (!currentTime) {
    return null; // Don't render until client-side hydration
  }

  return (
    <div
      className={`flex items-center justify-center gap-3 text-sm font-mono ${className}`}
    >
      <span className="tabular-nums">{currentTime}</span>
      <span className="opacity-40">|</span>
      <span className="tracking-wider transition-all duration-300">
        {hashFragment}
      </span>
    </div>
  );
}
