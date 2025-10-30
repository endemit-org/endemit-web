import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import FestivalSubscribe from "@/app/_components/newsletter/FestivalSubscribe";
import EndemitSubscribe from "@/app/_components/newsletter/EndemitSubscribe";
import InnerPage from "@/app/_components/content/InnerPage";

export type NewsletterSubscriptionProps =
  SliceComponentProps<Content.NewsletterSubscriptionSlice>;

const NewsletterSubscription: FC<NewsletterSubscriptionProps> = ({ slice }) => {
  const { primary } = slice;

  const props = {
    description: primary.override_description ?? undefined,
    title: primary.override_title ?? undefined,
  };

  const content =
    primary.list_type === "Festival" ? (
      <FestivalSubscribe {...props} />
    ) : primary.list_type === "General" ? (
      <EndemitSubscribe {...props} />
    ) : null;

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      {primary.include_frame ? <InnerPage>{content}</InnerPage> : content}
    </section>
  );
};

export default NewsletterSubscription;
