import { FC } from "react";
import { Content, isFilled, asText } from "@prismicio/client";
import { SliceComponentProps, PrismicRichText } from "@prismicio/react";
import Tabs, { TabItem } from "@/app/_components/content/Tabs";

/**
 * Props for `Tabs`.
 */
export type TabsProps = SliceComponentProps<Content.TabsSlice>;

/**
 * Component for "Tabs" Slices.
 */
const TabsSlice: FC<TabsProps> = ({ slice }) => {
  const { primary, items } = slice;

  const heading = isFilled.richText(primary.heading)
    ? asText(primary.heading)
    : undefined;

  const tabItems: TabItem[] = items
    .filter(
      item => isFilled.keyText(item.tabLabel) && isFilled.keyText(item.tabId)
    )
    .map(item => ({
      label: item.tabLabel,
      id: item.tabId,
      content: isFilled.richText(item.content) ? (
        <PrismicRichText field={item.content} />
      ) : (
        <p>No content</p>
      ),
    })) as TabItem[];

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <Tabs heading={heading} items={tabItems} />
    </section>
  );
};

export default TabsSlice;
