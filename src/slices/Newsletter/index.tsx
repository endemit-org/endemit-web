import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import FestivalSubscribe from "@/components/newsletter/FestivalSubscribe";
import EndemitSubscribe from "@/components/newsletter/EndemitSubscribe";

/**
 * Props for `NewsletterSubscription`.
 */
export type NewsletterSubscriptionProps =
  SliceComponentProps<Content.NewsletterSubscriptionSlice>;

/**
 * Component for "NewsletterSubscription" Slices.
 */
const NewsletterSubscription: FC<NewsletterSubscriptionProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      {slice.primary.list_type === "Festival" && <FestivalSubscribe />}
      {slice.primary.list_type === "General" && <EndemitSubscribe />}
    </section>
  );
};

export default NewsletterSubscription;
