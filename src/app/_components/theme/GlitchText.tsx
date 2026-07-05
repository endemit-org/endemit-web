/**
 * Server-rendered, JS-free glitch text effect.
 *
 * The visible text sits in normal flow; two CSS pseudo-elements
 * (`::before`/`::after`) reproduce it via `attr(data-text)` and are clipped +
 * offset by keyframes scoped in `themes/crt.css`. All motion lives behind
 * `prefers-reduced-motion: no-preference`, so reduced-motion users get the
 * plain string. Because it's pure markup + CSS it stays SSG-friendly and adds
 * no client JS.
 */

import clsx from "clsx";

interface GlitchTextProps {
  children: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3";
}

export default function GlitchText({
  children,
  className,
  as: Tag = "span",
}: GlitchTextProps) {
  return (
    <Tag
      className={clsx("crt-glitch-text", className)}
      data-text={children}
      aria-label={children}
    >
      {children}
    </Tag>
  );
}
