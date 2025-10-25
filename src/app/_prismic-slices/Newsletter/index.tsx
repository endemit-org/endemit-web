import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import FestivalSubscribe from "@/app/_components/newsletter/FestivalSubscribe";
import EndemitSubscribe from "@/app/_components/newsletter/EndemitSubscribe";

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
      {slice.primary.list_type === "Festival" && (
        <FestivalSubscribe
          description={slice.primary.override_description ?? undefined}
          title={slice.primary.override_title ?? undefined}
        />
      )}
      {slice.primary.list_type === "General" && (
        <EndemitSubscribe
          description={slice.primary.override_description ?? undefined}
          title={slice.primary.override_title ?? undefined}
        />
      )}
    </section>
  );
};

export default NewsletterSubscription;
