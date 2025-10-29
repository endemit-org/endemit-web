import { CmsMetaData } from "@/domain/cms/types/common";
import { RichTextField } from "@prismicio/client";

export type PodcastTrackInList = {
  artist: string;
  title: string;
  link?: string | null;
  timestamp?: string;
};

export interface Podcast {
  id: string;
  uid: string;
  name: string;
  number: string;
  date: Date | null;
  description: RichTextField | null;
  footnote: string;
  cover: {
    src: string;
    alt: string | null;
  } | null;
  track: {
    url: string;
  };
  tracklist: PodcastTrackInList[] | null;
  artist: {
    id: string;
    name: string;
    description?: RichTextField | null;
    image: { src: string; alt: string } | null;
    video: string | null;
    links:
      | {
          type: string;
          url: string;
        }[]
      | null;
  } | null;
  updatedAt: Date;
  meta: CmsMetaData;
}
