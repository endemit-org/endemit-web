import { CmsImage, CmsMetaData } from "@/types/common";

export type Venue = {
  id: string;
  uid: string;
  name: string;
  description: string;
  image: CmsImage | null;
  address: string | null;
  mapUrl: string | null;
  meta: CmsMetaData;
};
