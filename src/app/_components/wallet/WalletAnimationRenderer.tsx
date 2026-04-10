"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import FlyingCoin from "./FlyingCoin";
import type { CoinAnimation, AnimationDirection } from "./WalletCoinAnimation";
import { WALLET_ANIMATION_DURATION } from "./WalletCoinAnimation";

interface WalletAnimationRendererProps {
  animations: CoinAnimation[];
  showGlow: boolean;
  glowDirection: AnimationDirection;
  onAnimationComplete: (id: string) => void;
  children: React.ReactNode;
}

export default function WalletAnimationRenderer({
  animations,
  showGlow,
  glowDirection,
  onAnimationComplete,
  children,
}: WalletAnimationRendererProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative">
      {/* Glow effect overlay */}
      <AnimatePresence>
        {showGlow && (
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none z-20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1.02 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              boxShadow:
                glowDirection === "in"
                  ? "0 0 30px 10px rgba(34, 197, 94, 0.6), inset 0 0 20px rgba(34, 197, 94, 0.3)"
                  : "0 0 30px 10px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.2)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Scale bounce effect */}
      <motion.div
        animate={showGlow ? { scale: [1, 1.03, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.div>

      {/* Render coins via portal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {animations.map(anim => (
              <FlyingCoin
                key={anim.id}
                startX={anim.startX}
                startY={anim.startY}
                endX={anim.endX}
                endY={anim.endY}
                delay={anim.delay}
                duration={WALLET_ANIMATION_DURATION}
                direction={anim.direction}
                onComplete={() => onAnimationComplete(anim.id)}
              />
            ))}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
