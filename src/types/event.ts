import { ArtistAtEvent } from "@/types/artist";
import { CmsImage, CmsMetaData } from "@/types/common";

export enum EventVisibility {
  Visible = "Visible",
  Hidden = "Hidden",
}

export enum EventType {
  SingleDay = "Single day",
  Festival = "Festival",
  GuestAppearance = "Guest appearance",
}

export type VenueInEvent = {
  id: string;
  name: string;
  address: string;
  logo: CmsImage | null;
};

export type Event = {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  coverImage: CmsImage | null;
  promoImage: CmsImage | null;
  venue: VenueInEvent | null;
  colour: string;
  visibility: EventVisibility;
  type: EventType;
  date_start: Date | null;
  date_end: Date | null;
  event: string | null;
  artists: Array<ArtistAtEvent>;
  meta: CmsMetaData;
};
