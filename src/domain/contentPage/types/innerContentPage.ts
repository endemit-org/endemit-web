import { SliceZone } from "@prismicio/client";

export type InnerContentPage = {
  id: string;
  uid: string;
  title: string;
  slices: SliceZone;
  sortingWeight: number;
  connectedToEvent: string | null;
  connectedToProduct: string | null;
};
