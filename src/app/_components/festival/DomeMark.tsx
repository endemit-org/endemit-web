import type { CSSProperties } from "react";
import styles from "./festival.module.css";

/**
 * The festival's dome emblem as plain line segments, traced by hand from the
 * logo artwork (no vector source exists). Only the left half is listed; the
 * right half is its mirror image. Each segment draws itself in turn.
 */
const CENTER = 880;
type Point = readonly [number, number];
const P = {
  apex: [880, 428], crown: [880, 482], shoulder: [585, 493], hip: [342, 720], foot: [268, 1025], toe: [448, 1035],
  knot: [580, 745], bend: [545, 680], rim: [378, 712], peak: [655, 530], brow: [775, 562], tooth: [730, 803],
  heart: [880, 746], tail: [728, 890], heel: [525, 975], arch: [727, 836],
} as const satisfies Record<string, Point>;

/** [from, to, weight]: 3 the outer frame, 2 the inner struts, 1 the fine rays. */
const HALF: readonly (readonly [Point, Point, 1 | 2 | 3])[] = [
  [P.apex, P.shoulder, 3], [P.shoulder, P.hip, 3], [P.hip, P.foot, 3], [P.foot, P.toe, 3],
  [P.shoulder, P.crown, 3], [P.crown, P.foot, 3],
  [P.shoulder, P.knot, 2], [P.hip, P.knot, 2], [P.knot, P.heel, 2], [P.knot, P.tooth, 2],
  [P.peak, P.tooth, 2], [P.tooth, P.heart, 2], [P.toe, P.arch, 2], [P.arch, P.heart, 2],
  [P.shoulder, P.peak, 1], [P.peak, P.brow, 1], [P.peak, P.bend, 1], [P.bend, P.rim, 1], [P.bend, P.knot, 1],
  [P.rim, P.heel, 1], [P.apex, P.tail, 1], [P.apex, P.toe, 1], [P.apex, [458, 1030], 1],
];

const mirror = ([x, y]: Point): Point => [2 * CENTER - x, y];
const SEGMENTS = [
  [P.apex, P.crown, 3] as const,
  ...HALF.flatMap(([from, to, weight]) => [[from, to, weight] as const, [mirror(from), mirror(to), weight] as const]),
];

export default function DomeMark({ className }: { className?: string }) {
  return (
    <svg className={`${styles.domeMark} ${className ?? ""}`} viewBox="250 410 1260 640" fill="none" aria-hidden>
      {SEGMENTS.map(([from, to, weight], i) => (
        <line key={i} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} pathLength={1} data-weight={weight} style={{ "--i": i } as CSSProperties} />
      ))}
    </svg>
  );
}
