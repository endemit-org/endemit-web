import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import InnerPage from "@/app/_components/content/InnerPage";
import s from "./TextBlock.module.css";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";

export type ContentSectionProps =
  SliceComponentProps<Content.ContentSectionSlice>;

const ContentSection: FC<ContentSectionProps> = ({ slice }) => {
  const content = slice.primary.content ? (
    <RichTextDisplay richText={slice.primary.content} />
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
