import { CmsImage, CmsMetaData } from "@/domain/cms/types/common";
import { RichTextField } from "@prismicio/client";

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
  description?: RichTextField | null;
  image: CmsImage | null;
  video: string | null;
  isEndemitCrew: boolean;
  links: Array<{
    type: ArtistLinkType;
    url: string;
  }>;
  isB2b: boolean;
  b2bAttribution: { name: string; uid: string; id: string }[] | null;
  updatedAt: Date;
  meta: CmsMetaData;
};
