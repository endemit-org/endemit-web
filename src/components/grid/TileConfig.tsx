type TileSize = "small" | "medium" | "large" | "wide" | "tall";

export interface TileConfig {
  id: string;
  size: TileSize;
  title?: string;
  subtitle?: string;
  className?: string;
  media?: {
    type: "image" | "video";
    src: string;
  };
  link?: string;
  backgroundColor?: string;
  textColor?: string;
}

export const sizeMap: Record<TileSize, { col: string; row: string }> = {
  small: { col: "col-span-3 lg:col-span-2", row: "row-span-1" },
  medium: { col: "col-span-6 lg:col-span-4", row: "row-span-2" },
  large: { col: "col-span-6 lg:col-span-4 lg:col-span-3", row: "row-span-3" },
  wide: { col: "col-span-6 lg:col-span-6", row: "row-span-2" },
  tall: { col: "col-span-3 lg:col-span-3", row: "row-span-3" },
};
