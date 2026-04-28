"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface Props {
  seed?: number;
}

export default function BlurredArtistCard({ seed = 1 }: Props) {
  const config = useMemo(() => {
    const s = (seed + 1) * 17;
    return {
      baseWidth: 50 + ((s * 3) % 30),
      variance: 8 + ((s * 7) % 12),
      delay: ((s * 5) % 10) * 0.2,
      hueShift: (s * 11) % 30,
    };
  }, [seed]);

  return (
    <div className="bg-neutral-950 p-2 rounded-sm w-full relative">
      <div className="aspect-square overflow-hidden relative">
        <div className="absolute left-0 top-0 right-0 w-full bottom-0 border-[13px] z-20 border-neutral-100 scale-125 pointer-events-none" />
        <motion.div
          className="absolute inset-0 bg-neutral-700"
          style={{
            filter: `blur(24px) hue-rotate(${config.hueShift}deg)`,
          }}
          animate={{
            scale: [1, 1.1, 0.95, 1],
            opacity: [0.7, 0.9, 0.6, 0.7],
          }}
          transition={{
            duration: 8 + config.delay * 4,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: config.delay,
          }}
        />
      </div>

      <div className="relative p-4 flex flex-col items-center justify-center min-h-[64px]">
        <motion.div
          className="h-5 bg-neutral-300/80 rounded-full"
          style={{ filter: "blur(8px)" }}
          initial={{ width: `${config.baseWidth}%` }}
          animate={{
            width: [
              `${config.baseWidth}%`,
              `${config.baseWidth + config.variance}%`,
              `${config.baseWidth - config.variance / 2}%`,
              `${config.baseWidth}%`,
            ],
          }}
          transition={{
            duration: 10 + config.delay * 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: config.delay,
          }}
        />
      </div>
    </div>
  );
}
