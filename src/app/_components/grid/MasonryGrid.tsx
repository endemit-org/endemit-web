import React from "react";
import { TileConfig } from "@/app/_components/grid/TileConfig";
import Tile from "@/app/_components/grid/Tile";

interface MasonryGridProps {
  tiles: TileConfig[];
  className?: string;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({ tiles, className = "" }) => {
  return (
    <div className={`w-full bg-neutral-950 p-2 ${className}`}>
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-3
          gap-2
          auto-rows-[1fr]
        "
        style={{
          gridAutoFlow: "dense",
        }}
      >
        {tiles.map(tile => (
          <div
            key={tile.id}
            className="relative"
            style={{
              gridRow: tile.size === "portrait" ? "span 2" : "span 1",
              aspectRatio: tile.size === "portrait" ? "1/2" : "1/1",
            }}
          >
            <div className="h-full relative overflow-hidden">
              <Tile config={tile} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MasonryGrid;
