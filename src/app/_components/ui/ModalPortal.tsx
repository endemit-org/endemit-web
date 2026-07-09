"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders modal children into document.body so ancestor stacking contexts
 * (sticky wrappers, transforms, animation containers) can't trap the fixed
 * overlay underneath z-indexed page content. The mounted guard keeps SSR
 * happy — portals can't render on the server.
 */
export default function ModalPortal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
