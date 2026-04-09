import { CmsImage, CmsMetaData } from "@/domain/cms/types/common";
import { SliceZone } from "@prismicio/client";

export type ContentPage = {
  id: string;
  uid: string;
  title: string;
  renderFrame: boolean;
  backgroundImage: CmsImage | null;
  backgroundAnimated: boolean;
  slices: SliceZone;
  meta: CmsMetaData;
  updatedAt: Date;
};
