"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function EnvironmentIndicator() {
  const [mounted, setMounted] = useState(false);
  const [env, setEnv] = useState<"development" | "staging" | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
    const environment = process.env.NODE_ENV;
    const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;

    if (environment === "development") {
      setEnv("development");
    } else if (vercelEnv === "preview" || vercelEnv === "staging") {
      setEnv("staging");
    }
  }, []);

  if (!mounted || !env || !visible) return null;

  const isDev = env === "development";
  const label = isDev ? "DEV" : "STAGE";
  const bgColor = isDev ? "bg-red-500" : "bg-orange-500";
  const glowColor = isDev ? "shadow-red-500/50" : "shadow-orange-500/50";

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50">
      <div
        onClick={() => setVisible(false)}
        className={`${bgColor} ${glowColor} rounded-full px-4 py-2 shadow-lg animate-pulse flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity`}
      >
        <div className={`w-2 h-2 bg-white rounded-full animate-ping`} />
        <span className="text-white font-bold text-sm tracking-wider">
          {label}
        </span>
      </div>
    </div>,
    document.body
  );
}
