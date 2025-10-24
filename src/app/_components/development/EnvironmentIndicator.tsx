"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { isDevelopment, isPreview } from "@/lib/util/env";

function determineEnvironment(): "development" | "staging" | null {
  if (isDevelopment()) {
    return "development";
  }
  if (isPreview()) {
    return "staging";
  }
  return null;
}

export default function EnvironmentIndicator() {
  const [mounted, setMounted] = useState(false);
  const [env, setEnv] = useState<"development" | "staging" | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
    setEnv(determineEnvironment());
  }, []);

  if (!mounted) return null;
  if (!env) return null;
  if (!visible) return null;

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
        <div className="w-2 h-2 bg-neutral-200 rounded-full animate-ping" />
        <span className="text-neutral-200 font-bold text-sm tracking-wider">
          {label}
        </span>
      </div>
    </div>,
    document.body
  );
}
