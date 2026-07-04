import clsx from "clsx";
import BlurredTextPlaceholder from "@/app/_components/content/BlurredTextPlaceholder";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

// Type will be available after running Slice Machine to regenerate types
interface BlurredBlobProps {
  slice: {
    slice_type: string;
    variation: string;
    primary: {
      heading?: string | null;
      heading_sl?: string | null;
      description?: string | null;
      description_sl?: string | null;
      line_count?: number | null;
      render_frame?: boolean | null;
    };
  };
  context?: SliceContext;
}

const BlurredBlob = ({ slice, context }: BlurredBlobProps) => {
  const locale = context?.locale ?? "sl";
  const { line_count, render_frame } = slice.primary;
  const heading = pickLocalized(slice.primary, "heading", locale);
  const description = pickLocalized(slice.primary, "description", locale);
  const lineCount = line_count ?? 4;

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className={clsx(
        render_frame && "p-4 lg:p-10 max-lg:py-8 bg-neutral-800 rounded-md"
      )}
    >
      {(heading || description) && (
        <div className="text-center mb-24">
          {heading && (
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-200">
              {heading}
            </h2>
          )}
          {description && (
            <p className="text-neutral-400 mt-2">{description}</p>
          )}
        </div>
      )}
      <div className={"py-6"}>
        <BlurredTextPlaceholder lineCount={lineCount} />
      </div>
    </section>
  );
};

export default BlurredBlob;
