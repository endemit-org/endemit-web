"use client";

import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { formatTokensFromCents } from "@/lib/util/currency";

interface AnimatedBalanceProps {
  value: number;
  className?: string;
  countFromZero?: boolean;
  /** Where the count-up starts on mount (defaults to value, i.e. no intro
      animation). Only read on first render. */
  initialValue?: number;
}

export default function AnimatedBalance({
  value,
  className,
  countFromZero = false,
  initialValue,
}: AnimatedBalanceProps) {
  const prevValue = useRef(value);

  const spring = useSpring(initialValue ?? (countFromZero ? 0 : value), {
    stiffness: 100,
    damping: 20,
    mass: 1,
  });

  const display = useTransform(spring, (latest) => {
    return formatTokensFromCents(Math.round(latest));
  });

  useEffect(() => {
    spring.set(value);
    prevValue.current = value;
  }, [value, spring]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}
