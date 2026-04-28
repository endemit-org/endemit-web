import { SliceZone, SliceZoneLike } from "@prismicio/react";
import { components } from "@/app/_components/content/sliceComponents";

interface Props {
  slices: SliceZoneLike;
}

export default function SliceDisplay({ slices }: Props) {
  return <SliceZone slices={slices} components={components} />;
}
