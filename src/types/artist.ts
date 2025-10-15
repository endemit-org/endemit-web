import { CmsImage, CmsMetaData } from "@/types/common";

export enum ArtistLinkType {
  Soundcloud = "Soundcloud",
  Bandcamp = "Bandcamp",
  Instagram = "Instagram",
  ResidentAdvisor = "Resident Advisor",
  Other = "Other",
}

export type Artist = {
  id: string;
  uid: string;
  name: string;
  description: string;
  image: CmsImage | null;
  video: string | null;
  links: Array<{
    type: ArtistLinkType;
    url: string;
  }>;
  meta: CmsMetaData;
};

export type ArtistAtEvent = Artist & {
  start_time: Date | null;
  duration: number;
  stage: string | null;
};
