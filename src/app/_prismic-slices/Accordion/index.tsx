import { FC } from "react";
import { Content, isFilled, asText } from "@prismicio/client";
import { SliceComponentProps, PrismicRichText } from "@prismicio/react";
import Accordion, { AccordionItem } from "@/app/_components/content/Accordion";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

/**
 * Props for `Accordion`.
 */
export type AccordionProps = SliceComponentProps<
  Content.AccordionSlice,
  SliceContext
>;

/**
 * Component for "Accordion" Slices.
 */
const AccordionSlice: FC<AccordionProps> = ({ slice, context }) => {
  const { primary, items } = slice;
  const locale = context?.locale ?? "sl";

  const localizedHeading = pickLocalized(primary, "heading", locale);
  const heading = isFilled.richText(localizedHeading)
    ? asText(localizedHeading)
    : undefined;

  const accordionItems: AccordionItem[] = items
    .map(item => ({
      title: pickLocalized(item, "title", locale),
      content: pickLocalized(item, "content", locale),
    }))
    .filter(
      item => isFilled.keyText(item.title) && isFilled.richText(item.content)
    )
    .map(item => ({
      title: item.title,
      content: <PrismicRichText field={item.content} />,
    })) as AccordionItem[];

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <Accordion
        heading={heading}
        items={accordionItems}
        allowMultiple={primary.allowMultiple || false}
        renderFrame={primary.render_frame || false}
      />
    </section>
  );
};

export default AccordionSlice;
