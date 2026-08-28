"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import EventTicketDisplay from "@/app/_components/event/EventTicketsDisplay";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import ActionButton from "@/app/_components/form/ActionButton";
import TicketIcon from "@/app/_components/icon/TicketIcon";
import { Product } from "@/domain/product/types/product";
import { Event } from "@/domain/event/types/event";

export const TICKET_BUY_HASH = "ticketbuy";

interface Props {
  products: Product[];
  event: Event;
}

/**
 * Deep-linkable ticket purchase dialog: any URL ending in #ticketbuy opens a
 * centered dialog with the ticket selector, on every viewport. Also renders
 * the mobile "Get tickets" CTA, which opens the same dialog (the #tickets
 * anchor still scrolls to the inline section for existing links). The page
 * renders this component only when tickets are actually sellable, so
 * #ticketbuy on past/incognito/non-selling events silently no-ops.
 */
export default function EventTicketBuyModal({ products, event }: Props) {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);

  // Sync open state with the URL hash: opens on landing or hash navigation,
  // closes when the hash changes away (e.g. browser back).
  useEffect(() => {
    const syncFromHash = () => {
      setIsOpen(window.location.hash.slice(1) === TICKET_BUY_HASH);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
    };
  }, []);

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Open via state, not href: an href would render a Next Link whose
  // client-side pushState never fires `hashchange` (so the modal wouldn't
  // open) and which scrolls to top when the hash has no matching element.
  const open = () => {
    setIsOpen(true);
    window.history.pushState(null, "", `#${TICKET_BUY_HASH}`);
  };

  const close = () => {
    setIsOpen(false);
    if (window.location.hash.slice(1) === TICKET_BUY_HASH) {
      window.history.pushState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  };

  return (
    <>
      <div className={"lg:hidden mb-16 z-10 relative"}>
        <ActionButton
          onClick={open}
          variant="primary"
          className={"flex gap-x-2"}
        >
          <TicketIcon />
          {t("getTickets")}
        </ActionButton>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={t("tabs.tickets")}
        >
          <div
            className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto overscroll-contain bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-4 sm:p-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-x-4 mb-6">
              <h2 className="text-3xl font-heading tracking-wider uppercase text-neutral-200">
                {t("tabs.tickets")}
              </h2>
              <button
                onClick={close}
                className="text-neutral-400 hover:text-white uppercase tracking-wider text-sm py-2 px-3 -mr-3 flex-shrink-0"
              >
                {tc("close")}
              </button>
            </div>
            {/* Square event art above the listing: video when present,
                promo image as fallback */}
            {event.video ? (
              <div className="w-full max-w-[280px] mx-auto mb-6 rounded-lg overflow-hidden">
                <video
                  src={event.video}
                  loop={true}
                  muted={true}
                  autoPlay={true}
                  playsInline={true}
                  className="aspect-square w-full object-cover"
                />
              </div>
            ) : (
              event.promoImage?.src && (
                <div className="w-full max-w-[280px] mx-auto mb-6 rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={event.promoImage.src}
                    alt={event.promoImage.alt ?? event.name}
                    width={400}
                    height={400}
                    quality={85}
                    className="aspect-square w-full object-cover"
                    placeholder={event.promoImage.placeholder}
                  />
                </div>
              )
            )}
            <EventTicketDisplay
              products={products}
              event={event}
              autoExpandTicket={false}
            />
          </div>
        </div>
      )}
    </>
  );
}
