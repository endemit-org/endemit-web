"use client";

import { FC, useEffect, useState } from "react";
import { Content, isFilled, asText } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { useTranslations } from "next-intl";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

/**
 * Props for `DiscordBanner`.
 */
export type DiscordBannerProps = SliceComponentProps<
  Content.DiscordBannerSlice,
  SliceContext
>;

/** Official Discord mark (simple-icons path). */
function DiscordMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

/**
 * Component for "DiscordBanner" Slices: a blurple community banner with an
 * invite CTA and, when a server id is configured (and the server has its
 * Widget enabled), a live "N online" pill fetched client-side from Discord's
 * public widget API. The count degrades silently — no id, disabled widget or
 * a network error simply hide the pill.
 */
const DiscordBanner: FC<DiscordBannerProps> = ({ slice, context }) => {
  const t = useTranslations("discordBanner");
  const locale = context?.locale ?? "sl";
  const { primary } = slice;

  const localizedTitle = pickLocalized(primary, "title", locale);
  const title = isFilled.richText(localizedTitle) ? asText(localizedTitle) : "";

  const localizedDescription = pickLocalized(primary, "description", locale);
  const description = isFilled.richText(localizedDescription)
    ? asText(localizedDescription)
    : "";

  const inviteUrl = isFilled.link(primary.invite_link)
    ? primary.invite_link.url
    : undefined;
  const serverId = isFilled.keyText(primary.server_id)
    ? primary.server_id.trim()
    : undefined;

  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => {
    if (!serverId) return;
    let cancelled = false;
    fetch(`https://discord.com/api/guilds/${serverId}/widget.json`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled && typeof data?.presence_count === "number") {
          setOnlineCount(data.presence_count);
        }
      })
      .catch(() => {
        // Widget disabled or unreachable — just don't show the pill.
      });
    return () => {
      cancelled = true;
    };
  }, [serverId]);

  if (!inviteUrl) return null;

  return (
    <section className="my-8">
      <a
        href={inviteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-lg border border-[#5865F2]/25 bg-neutral-900/80 p-6 sm:p-8 transition-colors hover:border-[#5865F2]/50"
      >
        {/* Oversized faded mark bleeding off the right edge */}
        <DiscordMark className="pointer-events-none absolute -right-8 -bottom-10 w-48 sm:w-64 text-[#5865F2]/[0.07]" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <DiscordMark className="w-7 h-7 text-[#8a94f5] flex-shrink-0" />
              {title && (
                <h2 className="text-xl sm:text-2xl font-heading uppercase tracking-wider text-neutral-200">
                  {title}
                </h2>
              )}
            </div>
            {description && (
              <p className="text-neutral-400 text-sm sm:text-base max-w-xl">
                {description}
              </p>
            )}
            {onlineCount !== null && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-neutral-800/80 px-3 py-1 text-xs font-medium text-neutral-300">
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500/80" />
                {t("onlineNow", { count: onlineCount })}
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-2 rounded-lg bg-[#5865F2]/70 px-5 py-2.5 text-sm font-medium text-white transition-colors group-hover:bg-[#5865F2]/90">
              <DiscordMark className="w-4 h-4" />
              {t("join")}
            </span>
          </div>
        </div>
      </a>
    </section>
  );
};

export default DiscordBanner;
