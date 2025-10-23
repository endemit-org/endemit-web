import { CmsMetaData } from "@/domain/cms/types/common";
import { RichTextField } from "@prismicio/client";

export interface Podcast {
  id: string;
  uid: string;
  name: string;
  number: string;
  date: Date | null;
  description: string;
  cover: {
    src: string;
    alt: string | null;
  } | null;
  track: {
    url: string;
    apiUrl: string;
  };
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
  meta: CmsMetaData;
}
