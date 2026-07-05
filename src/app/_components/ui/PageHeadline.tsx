import Breadcrumb from "@/app/_components/ui/Breadcrumb";
import type { ReactNode } from "react";

interface Props {
  title: string;
  segments: { label: string; path: string }[];
  /**
   * Optional themed replacement for the plain title text (e.g. GlitchText).
   * Falls back to `title` when absent — non-themed pages are unaffected.
   */
  titleSlot?: ReactNode;
}

export default function PageHeadline({ title, segments, titleSlot }: Props) {
  return (
    <div className="flex relative z-10">
      <div>
        <h1 className="text-3xl font-bold text-neutral-200 mb-0 pb-0">
          {titleSlot ?? title}
        </h1>
        <Breadcrumb segments={segments} />
      </div>
    </div>
  );
}
