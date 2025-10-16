import { CmsMetaData } from "@/types/common";
import { SliceZone } from "@prismicio/client";

export type ContentPage = {
  id: string;
  uid: string;
  title: string;
  renderFrame: boolean;
  slices: SliceZone;
  meta: CmsMetaData;
};
