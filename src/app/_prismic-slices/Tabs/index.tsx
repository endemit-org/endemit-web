import { Content, isFilled, asText } from "@prismicio/client";
import { SliceComponentProps, PrismicRichText } from "@prismicio/react";
import Tabs, { TabItem } from "@/app/_components/content/Tabs";
import { fetchInnerContentFromCms } from "@/domain/cms/operations/fetchInnerContentFromCms";
import SliceDisplay, {
  type SliceContext,
} from "@/app/_components/content/SliceDisplay";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import { getTranslations } from "next-intl/server";

/**
 * Props for `Tabs`.
 */
export type TabsProps = SliceComponentProps<Content.TabsSlice, SliceContext>;

// Temporary type for innerContent variation items until slicemachine regenerates types
interface InnerContentItem {
  tabLabel: string | null;
  tabId: string | null;
  inner_content: {
    id?: string;
    uid?: string;
    type?: string;
    link_type: string;
  };
}

/**
 * Component for "Tabs" Slices.
 */
const TabsSlice = async ({ slice, context }: TabsProps) => {
  const { primary, items } = slice;
  const locale = context?.locale ?? "sl";
  const t = await getTranslations({ locale: locale as "sl" | "en", namespace: "common" });

  const localizedHeading = pickLocalized(primary, "heading", locale);
  const heading = isFilled.richText(localizedHeading)
    ? asText(localizedHeading)
    : undefined;

  let tabItems: TabItem[] = [];

  if ((slice.variation as string) === "innerContent") {
    // Inner Content variation - fetch linked inner content pages
    const innerContentItems = items as unknown as InnerContentItem[];

    const tabPromises = innerContentItems
      .filter(
        (item) =>
          item.tabLabel &&
          item.tabId &&
          item.inner_content?.uid
      )
      .map(async (item) => {
        const uid = item.inner_content?.uid;
        if (!uid) {
          return null;
        }

        const innerContent = await fetchInnerContentFromCms(uid, locale);
        if (!innerContent || !innerContent.slices) {
          return null;
        }

        return {
          label: pickLocalized(item, "tabLabel", locale)!,
          id: item.tabId!,
          content: (
            <SliceDisplay slices={innerContent.slices} locale={locale} />
          ),
        } as TabItem;
      });

    const results = await Promise.all(tabPromises);
    tabItems = results.filter((item): item is TabItem => item !== null);
  } else {
    // Default variation - use rich text content
    const defaultItems = items as Content.TabsSliceDefaultItem[];

    tabItems = defaultItems
      .filter(
        (item) => isFilled.keyText(item.tabLabel) && isFilled.keyText(item.tabId)
      )
      .map((item) => {
        const content = pickLocalized(item, "content", locale);
        return {
          label: pickLocalized(item, "tabLabel", locale),
          id: item.tabId,
          content: isFilled.richText(content) ? (
            <PrismicRichText field={content} />
          ) : (
            <p>{t("a11y.noContent")}</p>
          ),
        };
      }) as TabItem[];
  }

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
