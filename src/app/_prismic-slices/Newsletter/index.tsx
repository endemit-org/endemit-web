import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import FestivalSubscribe from "@/app/_components/newsletter/FestivalSubscribe";
import EndemitSubscribe from "@/app/_components/newsletter/EndemitSubscribe";
import InnerPage from "@/app/_components/ui/InnerPage";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

export type NewsletterSubscriptionProps = SliceComponentProps<
  Content.NewsletterSubscriptionSlice,
  SliceContext
>;

const NewsletterSubscription: FC<NewsletterSubscriptionProps> = ({
  slice,
  context,
}) => {
  const { primary } = slice;
  const locale = context?.locale ?? "sl";

  const props = {
    description: pickLocalized(primary, "override_description", locale) ?? undefined,
    title: pickLocalized(primary, "override_title", locale) ?? undefined,
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
