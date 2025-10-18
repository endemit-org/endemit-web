import { FC } from "react";
import { asImageSrc, asLink, Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import TileGrid from "@/components/grid/TileGrid";
import { TileConfig } from "@/components/grid/TileConfig";

/**
 * Props for `GridTile`.
 */
export type GridTileProps = SliceComponentProps<Content.GridTileSlice>;

/**
 * Component for "GridTile" Slices.
 */

type MediaSrc = {
  type: "image" | "video";
  src: string;
};

const GridTile: FC<GridTileProps> = ({ slice }) => {
  const tilesFromSlice = slice.primary.tiles.map((tile, index) => {
    const videoObject = asLink(tile.video);
    const imageObject = asImageSrc(tile.image);
    let mediaSrc: MediaSrc | null = null;
    const linkObject = asLink(tile.link);

    if (imageObject) {
      mediaSrc = {
        type: "image",
        src: imageObject,
      };
    }

    if (videoObject) {
      mediaSrc = {
        type: "video",
        src: videoObject,
      };
    }

    return {
      id: `slice-tile-${index}`,
      size: tile.size
        ? (tile.size.toLowerCase() as TileConfig["size"])
        : "medium",
      title: tile.headline || undefined,
      subtitle: tile.content || undefined,
      className: tile.override_class_definition || undefined,
      media: mediaSrc ?? undefined,
      link: linkObject ?? undefined,
      backgroundColor: tile.background_colour || undefined,
      textColor: tile.text_colour || undefined,
    };
  });

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <TileGrid tiles={tilesFromSlice} />
    </section>
  );
};

export default GridTile;
