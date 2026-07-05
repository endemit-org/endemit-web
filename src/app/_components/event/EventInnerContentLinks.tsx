"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import ChevronNextIcon from "@/app/_components/icon/ChevronNextIcon";
import InnerPage from "@/app/_components/ui/InnerPage";

export interface InnerContentLink {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface Props {
  pages: InnerContentLink[];
}

/**
 * Renders the event's linked Prismic content pages as a compact list of
 * links. Selecting one opens its content in a modal instead of stacking it
 * inline on the page — keeps content-heavy events from becoming endless
 * scrolls (especially on mobile).
 */
export default function EventInnerContentLinks({ pages }: Props) {
  const t = useTranslations("common");
  const [activeId, setActiveId] = useState<string | null>(null);

  // Open a modal when the URL hash matches one of the pages (deep-linking).
  useEffect(() => {
    const openFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (pages.some(p => p.id === hash)) setActiveId(hash);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [pages]);

  // Lock body scroll + close on Escape while the modal is open.
  useEffect(() => {
    if (!activeId) return;
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
  }, [activeId]);

  const open = (id: string) => {
    setActiveId(id);
    window.history.pushState(null, "", `#${id}`);
  };

  const close = () => {
    setActiveId(null);
    window.history.pushState(null, "", window.location.pathname);
  };

  const activePage = pages.find(p => p.id === activeId) ?? null;

  if (pages.length === 0) return null;

  return (
    <>
      <div className="flex flex-col divide-y divide-neutral-700 border-y border-neutral-700">
        {pages.map(page => (
          <button
            key={page.id}
            onClick={() => open(page.id)}
            className="flex items-center justify-between gap-x-4 py-5 text-left group"
          >
            <span className="text-neutral-200 group-hover:text-white font-heading uppercase tracking-wider text-2xl">
              {page.title}
            </span>
            <span className="text-neutral-500 group-hover:text-neutral-200 group-hover:translate-x-1 transition-transform w-5 flex-shrink-0">
              <ChevronNextIcon />
            </span>
          </button>
        ))}
      </div>

      {activePage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4 sm:p-8 overflow-y-auto"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={activePage.title}
        >
          <div className="ml-auto flex-shrink-0">
            <button
              onClick={close}
              className="text-neutral-400 hover:text-white uppercase tracking-wider text-sm py-2 px-3"
            >
              {t("close")}
            </button>
          </div>
          <div
            className="w-full max-w-4xl mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-4xl font-heading tracking-wider text-neutral-200 mb-8 uppercase">
              {activePage.title}
            </h2>
            <InnerPage>
              <div className="max-w-none">{activePage.content}</div>
            </InnerPage>
          </div>
        </div>
      )}
    </>
  );
}
