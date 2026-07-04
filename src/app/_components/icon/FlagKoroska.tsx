import clsx from "clsx";

/**
 * Stylized Koroška (Carinthia) flag: black heraldic panther on a gold field.
 * The panther is a single silhouette path — swap it out if you get finer
 * artwork; the surrounding field / rounding stays intact.
 */
export default function FlagKoroska({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 40"
      className={clsx("block", className)}
      role="img"
      aria-hidden="true"
    >
      <rect width="60" height="40" rx="4" fill="#F2B705" />
      <g fill="#111111">
        {/* Leaping panther silhouette (stylized) */}
        <path d="M7 22 C5 21 5 18 8 17.5 L11.5 17 C11.5 12 15 9.5 19 11
          C19.5 7.5 23 7.5 24 11 C25.5 9.5 28 10.5 28 13.5
          C34 12.5 41 11.5 47 14.5 C50 10 56 9 58.5 12
          C56.5 13.5 54 14 52 14.5 C55 18 55 24 51 28.5
          L56 36 L48.5 33.5 L46 26.5 C41 30 34 30.5 29 27
          L26 34 L19 31 L22.5 24 C15 25 9 21 9.5 16.5
          C8.5 18 7.5 20 7 22 Z" />
        {/* Red flame from the mouth — the panther traditionally breathes fire */}
        <path
          d="M8 17.5 C4 17 1 15.5 0.5 14 C3 14.5 5 14 7 12.5 C6 15 6.5 16.5 8 17.5 Z"
          fill="#D7263D"
        />
      </g>
    </svg>
  );
}
