"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import clsx from "clsx";

interface Props {
  lineCount?: number;
  className?: string;
}

interface LineConfig {
  baseWidth: number;
  variance: number;
  drift: number;
  delay: number;
}

function generateLineConfigs(count: number): LineConfig[] {
  // Use deterministic "random" values based on index for SSR consistency
  return Array.from({ length: count }, (_, i) => {
    const seed = (i + 1) * 17;
    return {
      baseWidth: 45 + ((seed * 3) % 35), // 45-80%
      variance: 8 + ((seed * 7) % 12), // 8-20% additional
      drift: ((seed * 11) % 10) - 5, // -5 to +5px
      delay: i * 0.4, // Staggered start
    };
  });
}

export default function BlurredTextPlaceholder({
  lineCount = 4,
  className,
}: Props) {
  const lineConfigs = useMemo(
    () => generateLineConfigs(lineCount),
    [lineCount]
  );

  return (
    <div className={clsx("w-full", className)}>
      <div className="flex flex-col items-center gap-5 w-full max-w-60 mx-auto">
        {lineConfigs.map((config, index) => (
          <motion.div
            key={index}
            className="h-5 bg-neutral-300/80 rounded-full"
            style={{ filter: "blur(10px)" }}
            initial={{ width: `${config.baseWidth}%`, x: 0 }}
            animate={{
              width: [
                `${config.baseWidth}%`,
                `${config.baseWidth + config.variance}%`,
                `${config.baseWidth - config.variance / 2}%`,
                `${config.baseWidth}%`,
              ],
              x: [0, config.drift, -config.drift / 2, 0],
            }}
            transition={{
              duration: 12 + index * 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: config.delay * 3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
