import { CmsImage, CmsMetaData } from "@/domain/cms/types/common";
import { GeoPointField, RichTextField } from "@prismicio/client";

export type Venue = {
  id: string;
  uid: string;
  name: string;
  description: RichTextField;
  coordinates: GeoPointField | null;
  logo: CmsImage | null;
  image: CmsImage | null;
  address: string | null;
  mapUrl: string | null;
  meta: CmsMetaData;
  showOnVenuePage: boolean;
  updatedAt: Date;
};
