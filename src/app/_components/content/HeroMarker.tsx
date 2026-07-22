import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import EventTicketAvailableStatus from "@/app/_components/event/EventTicketAvailableStatus";

/** Values of the Hero slice's `special_marker` select in Prismic. */
export type HeroSpecialMarker =
  | "None"
  | "Tickets available"
  | "Selling fast"
  | "Last tickets"
  | "Sold out"
  | "Just announced"
  | "New"
  | "New episode"
  | "Free entry"
  | "Coming soon";

type BadgeMarker = Exclude<HeroSpecialMarker, "None" | "Tickets available">;

// All badges share the tickets-available look (neutral text); the really
// important ones get the flame.
const BADGES: Record<BadgeMarker, { flame: boolean; pulse: boolean }> = {
  "Selling fast": { flame: true, pulse: true },
  "Last tickets": { flame: true, pulse: true },
  "Sold out": { flame: false, pulse: false },
  "Just announced": { flame: false, pulse: true },
  New: { flame: false, pulse: false },
  "New episode": { flame: false, pulse: true },
  "Free entry": { flame: false, pulse: false },
  "Coming soon": { flame: false, pulse: false },
};

interface Props {
  marker: HeroSpecialMarker;
  className?: string;
}

/**
 * The tag badge on a Hero. "Tickets available" keeps its flame treatment;
 * the rest share the same frame with a per-marker color and optional pulse.
 */
export default function HeroMarker({ marker, className }: Props) {
  const t = useTranslations("events");

  if (marker === "None") return null;
  if (marker === "Tickets available") {
    return <EventTicketAvailableStatus className={className} />;
  }

  const badge = BADGES[marker];
  if (!badge) return null;

  const labels: Record<BadgeMarker, string> = {
    "Selling fast": t("heroMarker.sellingFast"),
    "Last tickets": t("heroMarker.lastTickets"),
    "Sold out": t("heroMarker.soldOut"),
    "Just announced": t("heroMarker.justAnnounced"),
    New: t("heroMarker.new"),
    "New episode": t("heroMarker.newEpisode"),
    "Free entry": t("heroMarker.freeEntry"),
    "Coming soon": t("heroMarker.comingSoon"),
  };

  return (
    <div className={clsx("absolute top-4 left-4 z-10", className)}>
      <span
        className={clsx(
          "backdrop-blur-lg py-1 text-neutral-300 text-sm flex w-fit gap-x-2 uppercase font-bold border border-neutral-700",
          badge.flame ? "px-2" : "px-3"
        )}
      >
        {badge.flame && (
          <Image
            width={40}
            height={40}
            src="/images/transparent.gif"
            alt=""
            aria-hidden
            className="w-5 h-5 ml-1"
            unoptimized
          />
        )}
        <span className={badge.pulse ? "animate-pulse" : undefined}>
          {labels[marker]}
        </span>
      </span>
    </div>
  );
}
