"use client";

import { useState, useCallback, useRef } from "react";

const COIN_COUNT = 5;
const ANIMATION_DURATION = 0.8;
const STAGGER_DELAY = 0.08;

export type AnimationDirection = "in" | "out";

export interface CoinAnimation {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  direction: AnimationDirection;
}

export const WALLET_ANIMATION_DURATION = ANIMATION_DURATION;

export function useWalletAnimation() {
  const [animations, setAnimations] = useState<CoinAnimation[]>([]);
  const [showGlow, setShowGlow] = useState(false);
  const [glowDirection, setGlowDirection] = useState<AnimationDirection>("in");
  const animationIdRef = useRef(0);

  const getRandomEdgePosition = useCallback(() => {
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1000;
    const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;

    switch (edge) {
      case 0: // top
        return { x: Math.random() * windowWidth, y: -50 };
      case 1: // right
        return { x: windowWidth + 50, y: Math.random() * windowHeight };
      case 2: // bottom
        return { x: Math.random() * windowWidth, y: windowHeight + 50 };
      case 3: // left
      default:
        return { x: -50, y: Math.random() * windowHeight };
    }
  }, []);

  const getScatterPosition = useCallback((walletCenter: { x: number; y: number }, index: number) => {
    const angle = (index / COIN_COUNT) * Math.PI * 2 + Math.random() * 0.5;
    const distance = 200 + Math.random() * 150;
    return {
      x: walletCenter.x + Math.cos(angle) * distance,
      y: walletCenter.y + Math.sin(angle) * distance,
    };
  }, []);

  const triggerAnimation = useCallback(
    (direction: AnimationDirection, walletElement: HTMLElement | null) => {
      if (!walletElement) return;

      const rect = walletElement.getBoundingClientRect();
      const walletCenter = {
        x: rect.left + rect.width / 2 - 16,
        y: rect.top + rect.height / 2 - 16,
      };

      const newAnimations: CoinAnimation[] = [];

      for (let i = 0; i < COIN_COUNT; i++) {
        const id = `coin-${animationIdRef.current++}`;

        if (direction === "in") {
          const edgePos = getRandomEdgePosition();
          newAnimations.push({
            id,
            startX: edgePos.x,
            startY: edgePos.y,
            endX: walletCenter.x + (Math.random() - 0.5) * 20,
            endY: walletCenter.y + (Math.random() - 0.5) * 20,
            delay: i * STAGGER_DELAY,
            direction,
          });
        } else {
          const scatterPos = getScatterPosition(walletCenter, i);
          newAnimations.push({
            id,
            startX: walletCenter.x,
            startY: walletCenter.y,
            endX: scatterPos.x,
            endY: scatterPos.y,
            delay: i * STAGGER_DELAY,
            direction,
          });
        }
      }

      setAnimations(prev => [...prev, ...newAnimations]);
      setGlowDirection(direction);

      if (direction === "in") {
        // Start glow earlier, when coins are mid-flight and balance is counting
        setTimeout(() => {
          setShowGlow(true);
          setTimeout(() => setShowGlow(false), 600);
        }, 250);
      } else {
        setShowGlow(true);
        setTimeout(() => setShowGlow(false), 400);
      }
    },
    [getRandomEdgePosition, getScatterPosition]
  );

  const removeAnimation = useCallback((id: string) => {
    setAnimations(prev => prev.filter(a => a.id !== id));
  }, []);

  return {
    animations,
    showGlow,
    glowDirection,
    triggerAnimation,
    removeAnimation,
  };
}
