import { FC } from "react";
import TicketPriceProgressClient, {
  type PriceStepData,
} from "./TicketPriceProgressClient";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

interface PriceStepItem {
  title: string | null;
  title_sl?: string | null;
  description: string | null;
  description_sl?: string | null;
  price: number | null;
  available_from: string | null;
  available_until: string | null;
  is_visible: boolean | null;
}

interface TicketPriceProgressSlice {
  id: string;
  slice_type: string;
  variation: string;
  primary: {
    heading: string | null;
    heading_sl?: string | null;
    subheading: string | null;
    subheading_sl?: string | null;
  };
  items: PriceStepItem[];
}

interface TicketPriceProgressProps {
  slice: TicketPriceProgressSlice;
  context?: SliceContext;
}

/**
 * Server component that passes price step data to the client.
 * Prices for future steps are hidden to prevent inspection.
 */
const TicketPriceProgress: FC<TicketPriceProgressProps> = ({
  slice,
  context,
}) => {
  const { primary, items } = slice;
  const locale = context?.locale ?? "sl";

  const heading = pickLocalized(primary, "heading", locale) || null;
  const subheading = pickLocalized(primary, "subheading", locale) || null;

  const now = new Date();

  // Process steps - hide prices for steps that haven't started yet (unless visible)
  const steps: PriceStepData[] = items.map((item, index) => {
    const availableFrom = item.available_from
      ? new Date(item.available_from)
      : null;

    // Show price if the step has started OR if it's marked as visible
    const hasStarted = !availableFrom || now >= availableFrom;
    const isVisible = item.is_visible ?? true;
    const showPrice = hasStarted || isVisible;

    return {
      title: pickLocalized(item, "title", locale) || `Step ${index + 1}`,
      description: pickLocalized(item, "description", locale) || null,
      price: showPrice ? (item.price ?? null) : null,
      availableFrom: item.available_from || null,
      availableUntil: item.available_until || null,
      isVisible: isVisible,
    };
  });

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-12 md:py-16"
    >
      <TicketPriceProgressClient
        heading={heading}
        subheading={subheading}
        steps={steps}
      />
    </section>
  );
};

export default TicketPriceProgress;
