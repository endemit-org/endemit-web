import { FC } from "react";
import TicketPriceProgressClient, {
  type PriceStep,
} from "./TicketPriceProgressClient";

interface PriceStepItem {
  title: string | null;
  description: string | null;
  price: number | null;
  available_until: string | null;
}

interface TicketPriceProgressSlice {
  id: string;
  slice_type: string;
  variation: string;
  primary: {
    heading: string | null;
    subheading: string | null;
  };
  items: PriceStepItem[];
}

interface TicketPriceProgressProps {
  slice: TicketPriceProgressSlice;
}

/**
 * Server component that processes price steps and sanitizes future prices.
 * Future prices are replaced with fake values so they can't be inspected in dev tools.
 */
const TicketPriceProgress: FC<TicketPriceProgressProps> = ({ slice }) => {
  const { primary, items } = slice;

  const heading = primary.heading || null;
  const subheading = primary.subheading || null;

  const now = new Date();

  // Process steps and determine their state based on dates
  const steps: PriceStep[] = items.map((item, index) => {
    const availableUntil = item.available_until
      ? new Date(item.available_until)
      : null;

    // Determine if this step's date has passed
    const isPast = availableUntil ? now > availableUntil : false;

    // Find if this is the current active step
    // Current = first step whose date hasn't passed yet
    const isCurrentStep =
      !isPast &&
      items.findIndex((i) => {
        const date = i.available_until ? new Date(i.available_until) : null;
        return date ? now <= date : true;
      }) === index;

    // For future steps (not past and not current), hide real price
    const isFuture = !isPast && !isCurrentStep;

    return {
      title: item.title || `Step ${index + 1}`,
      description: item.description || null,
      // Only send real price for past and current steps
      price: isFuture ? null : item.price ?? null,
      availableUntil: availableUntil?.toISOString() ?? null,
      state: isPast ? "completed" : isCurrentStep ? "current" : "future",
    };
  });

  // If no current step found (all dates passed), mark the last one as current
  const hasCurrentStep = steps.some((s) => s.state === "current");
  if (!hasCurrentStep && steps.length > 0) {
    const lastStep = steps[steps.length - 1];
    if (lastStep.state === "completed") {
      // All steps completed - keep as is
    } else {
      // Mark first non-completed as current
      const firstFuture = steps.find((s) => s.state === "future");
      if (firstFuture) {
        firstFuture.state = "current";
        // Now we need to show the price for current
        const originalIndex = steps.indexOf(firstFuture);
        const originalItem = items[originalIndex];
        firstFuture.price = originalItem.price ?? null;
      }
    }
  }

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
