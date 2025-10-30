type TileSize = "square" | "portrait";

export interface TileConfig {
  id: string;
  size: TileSize;
  title?: string;
  subtitle?: string;
  className?: string;
  media?: {
    type: "image" | "video";
    src: string;
    placeholder?: string;
  };
  link?: string;
  backgroundColor?: string;
  textColor?: string;
}
