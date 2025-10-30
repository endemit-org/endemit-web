import { FC } from "react";
import { asImageSrc, asLink, Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { TileConfig } from "@/app/_components/grid/TileConfig";
import MasonryGrid from "@/app/_components/grid/MasonryGrid";
import { getBlurDataURL } from "@/lib/util/util";

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
  placeholder?: string;
};

const GridTile: FC<GridTileProps> = async ({ slice }) => {
  const tilesFromSlice = [];

  for (const [index, tile] of slice.primary.tiles.entries()) {
    const videoObject = asLink(tile.video);
    const imageObject = asImageSrc(tile.image);
    let mediaSrc: MediaSrc | null = null;
    const linkObject = asLink(tile.link);

    if (imageObject) {
      mediaSrc = {
        type: "image",
        src: imageObject,
        placeholder: await getBlurDataURL(imageObject),
      };
    }

    if (videoObject) {
      mediaSrc = {
        type: "video",
        src: videoObject,
      };
    }

    tilesFromSlice.push({
      id: `slice-tile-${index}`,
      size: tile.size
        ? (tile.size.toLowerCase() as TileConfig["size"])
        : "square",
      title: tile.headline || undefined,
      subtitle: tile.content || undefined,
      className: tile.override_class_definition || undefined,
      media: mediaSrc ?? undefined,
      link: linkObject ?? undefined,
      backgroundColor: tile.background_colour || undefined,
      textColor: tile.text_colour || undefined,
    });
  }

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <MasonryGrid tiles={tilesFromSlice} />
    </section>
  );
};

export default GridTile;
