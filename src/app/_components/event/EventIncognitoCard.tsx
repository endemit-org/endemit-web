import { getTranslations, getLocale } from "next-intl/server";
import { Event } from "@/domain/event/types/event";
import { formatEventDate, formatTime } from "@/lib/util/formatting";

/**
 * Replaces the ticket sidebar/tab on incognito (members-only) events: no
 * ticket wording anywhere, just a subtle badge and the practical essentials
 * — nothing that discourages showing up at the door.
 */
export default async function EventIncognitoCard({ event }: { event: Event }) {
  const t = await getTranslations("events.incognito");
  const locale = (await getLocale()) === "sl" ? "sl" : "en";

  return (
    <div className="text-neutral-200">
      <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-300 border border-neutral-600 rounded-full px-3 py-1 mb-6">
        <span aria-hidden>◈</span>
        {t("badge")}
      </div>

      <div className="space-y-3">
        {event.date_start && (
          <>
            <div className="text-2xl font-heading tracking-wider uppercase">
              {formatEventDate(
                event.date_start,
                event.date_end ?? event.date_start,
                locale
              )}
            </div>
            <div className="text-neutral-400">
              {t("startsAt", { time: formatTime(event.date_start) })}
            </div>
          </>
        )}
      </div>

      <p className="mt-6 text-sm text-neutral-400">{t("closedToPublic")}</p>

      <div className="mt-8 text-neutral-300 italic">{t("seeYouThere")}</div>
    </div>
  );
}
