import { CmsImage, CmsMetaData } from "@/domain/cms/types/common";
import { ArtistAtEvent } from "@/domain/artist/types/artistAtEvent";
import { GeoPointField, RichTextField, SliceZone } from "@prismicio/client";

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
  description: RichTextField;
  coordinates: GeoPointField;
  address: string;
  mapLocationUrl: string;
  logo: CmsImage | null;
};

export type Event = {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  coverImage: CmsImage | null;
  promoImage: CmsImage | null;
  artAuthor: {
    text: string;
    link: string;
  } | null;
  venue: VenueInEvent | null;
  colour: string;
  options: {
    visibility: EventVisibility;
    enabledLink: boolean;
    enabledTicketScanning: boolean;
  };
  tickets: {
    available: boolean;
    productId: string | null;
  };
  annotation?: string;
  type: EventType;
  date_start: Date | null;
  date_end: Date | null;
  event: string | null;
  artists: Array<ArtistAtEvent>;
  meta: CmsMetaData;
  slices: SliceZone;
};
