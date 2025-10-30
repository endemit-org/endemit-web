export type CmsMetaData = {
  title: string | null;
  description: string | null;
  image: string | null;
  priority?: number;
  frequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
};

export type CmsImage = {
  src: string;
  alt: string | null;
  placeholder: string;
};
