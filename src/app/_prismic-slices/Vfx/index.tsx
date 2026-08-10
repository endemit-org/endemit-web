import { FC } from "react";
import { Content, isFilled, asText } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";
import VfxCanvas, { type VfxKind } from "./VfxCanvas";

/**
 * Props for `Vfx`.
 */
export type VfxProps = SliceComponentProps<Content.VfxSlice, SliceContext>;

/**
 * Component for "Vfx" Slices: a hero-like band running a selectable WebGL
 * effect, with title/description overlaid and the whole slice as a link.
 */
const VfxSlice: FC<VfxProps> = ({ slice, context }) => {
  const { primary } = slice;
  const locale = context?.locale ?? "sl";

  const localizedTitle = pickLocalized(primary, "title", locale);
  const title = isFilled.richText(localizedTitle) ? asText(localizedTitle) : "";

  const localizedDescription = pickLocalized(primary, "description", locale);
  const description = isFilled.richText(localizedDescription)
    ? asText(localizedDescription)
    : "";

  const link = isFilled.link(primary.link) ? primary.link.url : undefined;
  const vfx = (primary.vfx ?? "Rave On") as VfxKind;

  const inner = (
    <>
      <VfxCanvas vfx={vfx} />

      {link && (
        <div className="absolute inset-0 border-[20px] border-neutral-100 scale-125 group-hover:scale-100 transition-transform duration-300 pointer-events-none z-20" />
      )}

      {(title || description) && (
        <div className="absolute bottom-0 z-10 w-full mx-auto px-4 sm:px-6 lg:px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/60 to-transparent -left-6 -right-6 -bottom-12 h-[100%]" />
          <div className="flex flex-col text-left relative z-10 group-hover:scale-95 transition-transform duration-300 pb-6 pt-3">
            {title && (
              <h2
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-200 max-w-4xl"
                style={{ textShadow: "0 4px 8px rgba(0, 0, 0, 0.9)" }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                className="text-lg sm:text-xl text-neutral-200/90 max-w-2xl"
                style={{ textShadow: "0 4px 8px rgba(0, 0, 0, 0.9)" }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );

  const sectionClass =
    "relative block h-[65vh] min-h-[420px] overflow-hidden bg-neutral-950 border-8 border-neutral-950 group";

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      {link ? (
        <Link href={link} className={sectionClass}>
          {inner}
        </Link>
      ) : (
        <div className={sectionClass}>{inner}</div>
      )}
    </section>
  );
};

export default VfxSlice;
