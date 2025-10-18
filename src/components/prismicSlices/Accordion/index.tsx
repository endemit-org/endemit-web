import { FC } from "react";
import { Content, isFilled, asText } from "@prismicio/client";
import { SliceComponentProps, PrismicRichText } from "@prismicio/react";
import Accordion, { AccordionItem } from "@/components/content/Accordion";

/**
 * Props for `Accordion`.
 */
export type AccordionProps = SliceComponentProps<Content.AccordionSlice>;

/**
 * Component for "Accordion" Slices.
 */
const AccordionSlice: FC<AccordionProps> = ({ slice }) => {
  const { primary, items } = slice;

  const heading = isFilled.richText(primary.heading)
    ? asText(primary.heading)
    : undefined;

  const accordionItems: AccordionItem[] = items
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
      />
    </section>
  );
};

export default AccordionSlice;
