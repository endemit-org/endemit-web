import { ReactNode } from "react";
import clsx from "clsx";

interface Props {
  children: ReactNode;
  /**
   * Hide the items that would only partly fill the last row, so a 4-item
   * "related" strip shows 3 when only 3 columns fit instead of one orphan
   * on a new row. Leave off for exhaustive listings (category pages,
   * expanded "view all" lists) where every item must stay reachable.
   */
  trimOrphans?: boolean;
  /** Extra classes for the grid element (e.g. `mt-8`). */
  className?: string;
}

/**
 * The 2 → 3 → 4 column card grid used for podcasts and products. Column
 * count follows the *container* width (not the viewport), so the same grid
 * adapts inside framed panels and side columns. Orphan-trimming rules live
 * in globals.css and must track the container breakpoints used here.
 */
export default function CardGrid({ children, trimOrphans, className }: Props) {
  return (
    <div className="@container w-full">
      <div
        className={clsx(
          "grid gap-2 w-full grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4",
          trimOrphans && "card-grid-trim",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
