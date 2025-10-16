import Tile from "@/components/grid/Tile";
import { TileConfig } from "@/components/grid/TileConfig";

interface Props {
  tiles: TileConfig[];
}

export default function TileGrid({ tiles }: Props) {
  return (
    <div
      className="grid grid-cols-6 lg:grid-cols-8 8xl:grid-cols-12 auto-rows-[200px] lg:auto-rows-[300px] gap-2 p-2"
      style={{ gridAutoFlow: "dense" }}
    >
      {tiles.map(tile => (
        <Tile key={tile.id} config={tile} />
      ))}
    </div>
  );
}
