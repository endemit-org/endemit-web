import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import InnerPage from "@/app/_components/ui/InnerPage";
import s from "./TextBlock.module.css";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

export type ContentSectionProps = SliceComponentProps<
  Content.ContentSectionSlice,
  SliceContext
>;

const ContentSection: FC<ContentSectionProps> = ({ slice, context }) => {
  const localizedContent = pickLocalized(
    slice.primary,
    "content",
    context?.locale ?? "sl"
  );
  const content = localizedContent ? (
    <RichTextDisplay richText={localizedContent} />
  ) : null;

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className={s.markdown}
    >
      {slice.primary.render_frame ? (
        <InnerPage>{content}</InnerPage>
      ) : (
        <div className={"text-neutral-200"}>{content}</div>
      )}
    </section>
  );
};

export default ContentSection;
