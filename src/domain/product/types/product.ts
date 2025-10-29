import { CmsMetaData } from "@/domain/cms/types/common";
import { RichTextField, SliceZone } from "@prismicio/client";

export enum ProductType {
  PHYSICAL = "Physical",
  DIGITAL = "Digital",
}

export enum ProductCategory {
  MERCH = "Merch",
  MUSIC = "Music",
  ALBUMS = "Albums",
  DONATIONS = "Donations",
  TICKETS = "Tickets",
  LICENSES = "Licenses",
  CURRENCIES = "Currencies",
  OTHER = "Other",
}

export enum ProductStatus {
  AVAILABLE = "Available",
  PREORDER = "Preorder",
  COMING_SOON = "Coming soon",
  OUT_OF_STOCK = "Out of stock",
  SOLD_OUT = "Sold out",
}

export enum ProductVisibility {
  VISIBLE = "Visible",
  HIDDEN = "Hidden",
}

export enum VariantValue {
  XS = "XS",
  S = "S",
  M = "M",
  L = "L",
  XL = "XL",
  XXL = "XXL",
  BLACK = "Black",
  WHITE = "White",
}

export enum VariantType {
  SIZE = "Size",
  COLOUR = "Colour",
}

export enum ProductCompositionType {
  SINGLE = "Single",
  CONFIGURABLE = "Configurable",
  VARIANT = "Variant",
}

export enum ProductRegion {
  SLOVENIA = "Slovenia",
  EU = "EU",
  NON_EU_EUROPE = "Non-EU Europe",
  UK = "UK",
  NORTH_AMERICA = "North America",
  AUSTRALIA = "Australia",
  JAPAN = "Japan",
}

export type ProductImage = {
  src: string;
  alt?: string;
};

export type ProductRelatedEvent = {
  id: string;
  uid: string;
  title: string;
  venueName: string;
  venueAddress: string;
  venueLogo: string;
  date: string;
};

export interface Product {
  id: string;
  uid: string;
  name: string;
  description: RichTextField;
  images: ProductImage[];
  video: string | null;
  price: number;
  currency: string;
  composition: ProductCompositionType;
  type: ProductType;
  status: ProductStatus;
  visibility: ProductVisibility;
  category: ProductCategory;
  isFeatured: boolean;
  sortingWeight: number;
  weight: number | null;
  slices: SliceZone;
  limits: {
    quantityLimit: number | null;
    regionalEligibility: Array<{
      region: ProductRegion;
    }>;
    cutoffTimestamp: Date | string | null;
  };
  variants: Array<{
    variant_value: string;
    variant_type: string;
  }>;
  relatedProducts: Array<{
    id: string;
    uid: string;
    title: string;
    description: string;
    category: ProductCategory;
    type: ProductType;
    status: ProductStatus;
    visibility: ProductVisibility;
    images: ProductImage[];
    price: number;
    sortingWeight: number;
    callToAction: string;
  }> | null;
  relatedEvent: ProductRelatedEvent | null;
  specialNotice: string;
  displaySlicePosition: "Above description" | "Below description";
  checkoutDescription: string;
  updatedAt: Date;
  meta: CmsMetaData;
}
