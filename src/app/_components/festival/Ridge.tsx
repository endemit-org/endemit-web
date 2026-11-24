import styles from "./festival.module.css";

const PATHS = {
  near: "M0,3 C12,7 22,1 35,4 S58,8 70,3 S90,1 100,5",
  far: "M0,5 C9,1 17,8 28,4 S47,0 58,5 S81,8 100,2",
};

/**
 * A ridge of ground. Only the wavy top strip is an SVG (it carries the boiling
 * outline); the ground under it is a plain block, so the filter stays small.
 */
export default function Ridge({ far = false }: { far?: boolean }) {
  return (
    <div className={styles.campGround} data-far={far || undefined}>
      <svg className={styles.campRidge} viewBox="0 0 100 9" preserveAspectRatio="none">
        {/* The fill closes down to the block below; only the open top line is stroked. */}
        <path d={`${far ? PATHS.far : PATHS.near} V9 H0Z`} stroke="none" />
        <path d={far ? PATHS.far : PATHS.near} fill="none" />
      </svg>
    </div>
  );
}
