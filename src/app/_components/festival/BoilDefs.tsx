import styles from "./festival.module.css";

const FILTERS = [
  ["fest-boil-a", 3, 5.5, 0.03],
  ["fest-boil-b", 11, 5.5, 0.03],
  ["fest-boil-c", 23, 5.5, 0.03],
  ["fest-boil-sa", 5, 2.2, 0.05],
  ["fest-boil-sb", 17, 2.2, 0.05],
  ["fest-boil-sc", 29, 2.2, 0.05],
] as const;

/** The displacement filters behind the hand-drawn "boil" of festival type. */
export default function BoilDefs({ warp = false }: { warp?: boolean }) {
  return (
    <svg className={styles.defs} aria-hidden focusable="false">
      <defs>
        {FILTERS.map(([id, seed, scale, frequency]) => (
          <filter key={id} id={id} x="-4%" y="-12%" width="108%" height="124%">
            <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={2} seed={seed} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={scale} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
        {warp ? (
          <filter id="fest-warp" x="-12%" y="-12%" width="124%" height="124%">
            <feTurbulence type="turbulence" baseFrequency="0.006 0.013" numOctaves={2} seed={7} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={0} xChannelSelector="R" yChannelSelector="B" />
          </filter>
        ) : null}
      </defs>
    </svg>
  );
}
