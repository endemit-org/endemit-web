import {
  ProductCategory,
  ProductRegion,
  ProductStatus,
  ProductType,
  ProductVisibility,
  VariantType,
  VariantValue,
} from "@/domain/product/types/product";
import { SliceZone } from "@prismicio/client";

export interface PrismicImage {
  dimensions: {
    width: number;
    height: number;
  };
  alt: string | null;
  copyright: string | null;
  url: string;
  id: string;
  edit: {
    x: number;
    y: number;
    zoom: number;
    background: string;
  };
}

export interface PrismicVideo {
  link_type: "Media";
  name: string;
  kind: string;
  url: string;
  size: string;
  height?: string;
  width?: string;
}

export interface PrismicRichTextSpan {
  start: number;
  end: number;
  type: "strong" | "em" | "hyperlink";
  data?: {
    link_type?: string;
    url?: string;
  };
}

export interface PrismicRichTextBlock {
  type: "paragraph" | "heading4" | "list-item" | "o-list-item";
  text: string;
  spans: PrismicRichTextSpan[];
  direction: "ltr" | "rtl";
}

// Group field types
export interface ImageGroup {
  image: PrismicImage;
}

export interface ProductVariant {
  variant_value: VariantValue;
  variant_type: VariantType;
}

export interface RegionalEligibility {
  region: ProductRegion;
}

export interface PrismicEventReference {
  id: string;
  type: "event";
  tags: string[];
  lang: string;
  slug: string;
  uid: string;
  data: {
    title: string;
    venue_name: string;
    venue_address: string;
    venue_logo: PrismicImage;
    date_start: string;
  };
  link_type: "Document";
  isBroken: boolean;
}

export interface PrismicProductReference {
  id: string;
  type: "product";
  tags: string[];
  lang: string;
  slug: string;
  first_publication_date: string;
  last_publication_date: string;
  uid: string;
  data: {
    title: string;
    description: PrismicRichTextBlock[];
    product_category: ProductCategory;
    product_type: ProductType;
    product_status: ProductStatus;
    product_visibility: ProductVisibility;
    images: ImageGroup[];
    price: number;
    sorting_weight: number | null;
  };
  link_type: "Document";
  key: string;
  isBroken: boolean;
}

export interface RelatedProduct {
  related_product: PrismicProductReference;
  call_to_action: string;
}

// Main Product Document Data
export interface PrismicProductData {
  // About tab
  title: string;
  product_category: ProductCategory;
  product_type: ProductType;
  images: ImageGroup[];
  video: PrismicVideo | null;
  description: PrismicRichTextBlock[];
  related_products: RelatedProduct[];
  related_to_event: PrismicEventReference;
  special_notice: string | null;
  checkout_description: string | null;

  // Attributes tab
  product_status: ProductStatus;
  product_visibility: ProductVisibility;
  price: number;
  weight: number | null;
  featured_product: boolean;
  sorting_weight: number | null;

  // Variants tab
  variants: ProductVariant[];

  // Limitations tab
  regional_eligibility: RegionalEligibility[];
  quantity_limit: number | null;
  cutoff_date: string | null;

  // SEO & Metadata tab
  meta_title: string | null;
  meta_description: string | null;
  meta_image: Partial<PrismicImage>;
}

// Complete Product Document
export interface PrismicProductDocument {
  id: string;
  uid: string;
  url: string | null;
  type: "product";
  href: string;
  tags: string[];
  first_publication_date: string;
  last_publication_date: string;
  slugs: string[];
  lang: string;
  data: PrismicProductData;
}

// Event Types
export interface PrismicVenueReference {
  id: string;
  type: "venue";
  tags: string[];
  lang: string;
  slug: string;
  uid: string;
  data: {
    name: string;
    map_location_url: {
      link_type: string;
      url: string;
    };
    address: string;
    venue_logo: PrismicImage;
  };
  link_type: "Document";
  isBroken: boolean;
}

export interface PrismicArtistReference {
  id: string;
  type: "artist";
  tags: string[];
  lang: string;
  slug: string;
  uid: string;
  data: {
    name: string;
    description: PrismicRichTextBlock[];
    image: PrismicImage;
    links: ArtistLink[];
    video: PrismicVideo | null;
  };
  link_type: "Document";
  isBroken: boolean;
}

export interface EventArtist {
  artist: PrismicArtistReference;
  start_time: string;
  duration: number;
  stage: string | null;
  description_override: PrismicRichTextBlock[];
  image_override: PrismicImage | null;
  video_override: PrismicVideo | null;
}

export interface PrismicEventData {
  // About
  cover_image: PrismicImage;
  promo_image: PrismicImage;
  video: PrismicVideo | null;
  title: string;
  description: PrismicRichTextBlock[];

  // Venue
  venue: PrismicVenueReference;

  // Schedule
  date_start: string;
  date_end: string;
  artists: EventArtist[];

  // Attributes
  event_type: "Single day" | "Festival" | "Guest appearance";
  visibility: "Visible" | "Hidden";
  colour: string;

  // SEO & Metadata
  meta_title: string | null;
  meta_description: string | null;
  meta_image: Partial<PrismicImage>;
}

export interface PrismicEventDocument {
  id: string;
  uid: string;
  url: string | null;
  type: "event";
  href: string;
  tags: string[];
  first_publication_date: string;
  last_publication_date: string;
  slugs: string[];
  lang: string;
  data: PrismicEventData;
}

// Artist Types
export type ArtistLinkType =
  | "Soundcloud"
  | "Bandcamp"
  | "Instagram"
  | "Resident Advisor"
  | "Other";

export interface ArtistLink {
  type: ArtistLinkType;
  link: {
    link_type: string;
    url: string;
  };
}

export interface PrismicArtistData {
  // About
  name: string;
  description: PrismicRichTextBlock[];
  image: PrismicImage;
  video: PrismicVideo | null;
  links: ArtistLink[];

  // SEO & Metadata
  meta_title: string | null;
  meta_description: string | null;
  meta_image: Partial<PrismicImage>;
}

export interface PrismicArtistDocument {
  id: string;
  uid: string;
  url: string | null;
  type: "artist";
  href: string;
  tags: string[];
  first_publication_date: string;
  last_publication_date: string;
  slugs: string[];
  lang: string;
  data: PrismicArtistData;
}

// Venue Types
export interface PrismicVenueData {
  // About
  name: string;
  description: PrismicRichTextBlock[];
  address: string;
  venue_logo: PrismicImage;
  map_location_url: {
    link_type: string;
    url: string;
  };

  // SEO & Metadata
  meta_title: string | null;
  meta_description: string | null;
  meta_image: Partial<PrismicImage>;
}

export interface PrismicVenueDocument {
  id: string;
  uid: string;
  url: string | null;
  type: "venue";
  href: string;
  tags: string[];
  first_publication_date: string;
  last_publication_date: string;
  slugs: string[];
  lang: string;
  data: PrismicVenueData;
}

// Main Content Page Data
export interface PrismicContentPageData {
  // Main
  title: string;
  render_frame: boolean;
  slices: SliceZone;

  // SEO & Metadata
  meta_title: string | null;
  meta_description: string | null;
  meta_image: Partial<PrismicImage>;
}

// Complete Content Page Document
export interface PrismicContentPageDocument {
  id: string;
  uid: string;
  url: string | null;
  type: "content_page";
  href: string;
  tags: string[];
  first_publication_date: string;
  last_publication_date: string;
  slugs: string[];
  lang: string;
  data: PrismicContentPageData;
}

// Add to your existing types file

export interface PodcastTrack {
  title: string;
  artist: string;
  link: {
    link_type: string;
    url: string;
    target?: string;
  };
}

export interface PrismicPodcastData {
  // Main
  cover_image: PrismicImage;
  episode_name: string;
  episode_number: string;
  description: string;
  artist: PrismicArtistReference;
  episode_date: string;
  track_url: string;
  track_api_url: string;
  tracklist: PodcastTrack[];
  slices: SliceZone;

  // SEO & Metadata
  meta_title: string | null;
  meta_description: string | null;
  meta_image: Partial<PrismicImage>;
}

export interface PrismicPodcastDocument {
  id: string;
  uid: string;
  url: string | null;
  type: "podcast";
  href: string;
  tags: string[];
  first_publication_date: string;
  last_publication_date: string;
  slugs: string[];
  lang: string;
  data: PrismicPodcastData;
}
