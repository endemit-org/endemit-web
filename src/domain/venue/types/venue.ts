import { CmsImage, CmsMetaData } from "@/domain/cms/types/common";

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
