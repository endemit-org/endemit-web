import clsx from "clsx";

/**
 * Union Jack flag used for the English language option. Standard heraldic
 * construction (counterchanged red diagonals), clipped to rounded corners.
 */
export default function FlagEnglish({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 40"
      className={clsx("block", className)}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="uk-round">
          <rect width="60" height="40" rx="4" />
        </clipPath>
        <clipPath id="uk-quarters">
          <path d="M30 20 L60 40 V20 z M30 20 L60 0 H30 z M30 20 L0 0 V20 z M30 20 L0 40 H30 z" />
        </clipPath>
      </defs>
      <g clipPath="url(#uk-round)">
        <rect width="60" height="40" fill="#012169" />
        {/* White diagonals (St Andrew) */}
        <path d="M0 0 L60 40 M60 0 L0 40" stroke="#FFFFFF" strokeWidth="8" />
        {/* Red diagonals (St Patrick), counterchanged */}
        <path
          d="M0 0 L60 40 M60 0 L0 40"
          clipPath="url(#uk-quarters)"
          stroke="#C8102E"
          strokeWidth="4"
        />
        {/* White cross (St George) */}
        <path d="M30 0 V40 M0 20 H60" stroke="#FFFFFF" strokeWidth="13" />
        {/* Red cross */}
        <path d="M30 0 V40 M0 20 H60" stroke="#C8102E" strokeWidth="8" />
      </g>
    </svg>
  );
}
