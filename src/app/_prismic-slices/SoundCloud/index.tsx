import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import EmbedSoundCloud from "@/app/_components/content/EmbedSoundCloud";

/**
 * Props for `SoundCloud`.
 */
export type SoundCloudProps = SliceComponentProps<Content.SoundCloudSlice>;

/**
 * Component for "SoundCloud" Slices.
 */
const SoundCloud: FC<SoundCloudProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <EmbedSoundCloud
        url={String(slice.primary.url)}
        height={slice.primary.height ?? undefined}
        color={slice.primary.color ?? undefined}
      />
    </section>
  );
};

export default SoundCloud;
