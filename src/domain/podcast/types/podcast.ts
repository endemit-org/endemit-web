import { CmsImage, CmsMetaData } from "@/domain/cms/types/common";
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
  published: boolean;
  name: string;
  number: string;
  date: Date | null;
  description: RichTextField | null;
  footnote: string;
  tile: CmsImage | null;
  cover: CmsImage | null;
  track: {
    url: string;
  };
  tracklist: PodcastTrackInList[] | null;
  artist: {
    uid: string;
    id: string;
    name: string;
    description?: RichTextField | null;
    image: CmsImage;
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
