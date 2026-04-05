"use client";

import { usePlayerStore } from "@/app/_stores/PlayerStore";

const COLLAPSED_HEIGHT = 48;
const EXPANDED_HEIGHT = 120;

interface PlayerContentWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function PlayerContentWrapper({
  children,
  className = "",
}: PlayerContentWrapperProps) {
  const { isVisible, isExpanded } = usePlayerStore();

  const paddingBottom = isVisible
    ? isExpanded
      ? EXPANDED_HEIGHT
      : COLLAPSED_HEIGHT
    : 0;

  return (
    <div
      className={className}
      style={{ paddingBottom: `${paddingBottom}px` }}
    >
      {children}
    </div>
  );
}
