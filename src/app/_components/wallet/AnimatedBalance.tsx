"use client";

import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { formatTokensFromCents } from "@/lib/util/currency";

interface AnimatedBalanceProps {
  value: number;
  className?: string;
}

export default function AnimatedBalance({ value, className }: AnimatedBalanceProps) {
  const prevValue = useRef(value);

  const spring = useSpring(value, {
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
