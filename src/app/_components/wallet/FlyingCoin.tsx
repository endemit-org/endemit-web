"use client";

import { motion } from "framer-motion";

interface FlyingCoinProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  duration: number;
  direction: "in" | "out";
  onComplete?: () => void;
}

export default function FlyingCoin({
  startX,
  startY,
  endX,
  endY,
  delay,
  duration,
  direction,
  onComplete,
}: FlyingCoinProps) {
  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[10001]"
      initial={{
        x: startX,
        y: startY,
        opacity: direction === "in" ? 1 : 1,
        scale: direction === "in" ? 0.5 : 1,
      }}
      animate={{
        x: endX,
        y: endY,
        opacity: direction === "out" ? 0 : 1,
        scale: direction === "in" ? 1 : 0.5,
      }}
      transition={{
        duration,
        delay,
        ease: direction === "in" ? [0.34, 1.56, 0.64, 1] : [0.36, 0, 0.66, -0.56],
      }}
      onAnimationComplete={onComplete}
      style={{
        perspective: "500px",
      }}
    >
      <motion.div
        className="w-8 h-8"
        animate={{
          rotateY: [0, 360, 720, 1080],
          rotateX: [0, 15, -15, 0],
        }}
        transition={{
          duration: duration + delay,
          ease: "linear",
          times: [0, 0.33, 0.66, 1],
        }}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Coin SVG - circular token design */}
        <svg
          viewBox="0 0 32 32"
          className="w-full h-full drop-shadow-lg"
          style={{
            filter: "drop-shadow(0 4px 8px rgba(234, 179, 8, 0.5))",
          }}
        >
          {/* Outer ring */}
          <circle
            cx="16"
            cy="16"
            r="15"
            fill="url(#coinGradient)"
            stroke="url(#coinBorder)"
            strokeWidth="1.5"
          />
          {/* Inner circle */}
          <circle cx="16" cy="16" r="11" fill="url(#coinInner)" />
          {/* ǝŧ symbol for Endemit */}
          <text
            x="16"
            y="20"
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill="url(#textGradient)"
            fontFamily="system-ui, sans-serif"
          >
            ǝŧ
          </text>
          {/* Shine effect */}
          <ellipse
            cx="11"
            cy="10"
            rx="4"
            ry="2"
            fill="rgba(255,255,255,0.3)"
            transform="rotate(-30 11 10)"
          />
          <defs>
            <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="coinBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="coinInner" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="textGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </motion.div>
  );
}
