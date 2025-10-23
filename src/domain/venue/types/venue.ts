import { CmsImage, CmsMetaData } from "@/domain/cms/types/common";
import { RichTextField } from "@prismicio/client";

export type Venue = {
  id: string;
  uid: string;
  name: string;
  description: RichTextField;
  image: CmsImage | null;
  address: string | null;
  mapUrl: string | null;
  meta: CmsMetaData;
};
