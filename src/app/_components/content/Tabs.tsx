"use client";

import { useState, useEffect, useRef } from "react";
import InnerPage from "@/app/_components/ui/InnerPage";
import Link from "next/link";

export interface TabItem {
  label: string;
  id: string;
  content: React.ReactNode;
  sortingWeight?: number;
  hideTitle?: boolean;
  mobileOnly?: boolean;
}

export interface TabsProps {
  heading?: string;
  items: TabItem[];
  sortByWeight?: boolean;
  backgroundColor?: string;
}

export default function Tabs({
  heading,
  items,
  sortByWeight = false,
  backgroundColor,
}: TabsProps) {
  const hashFromUrl =
    typeof window !== "undefined" ? window.location.hash.slice(1) : "";

  if (sortByWeight) {
    items = items.sort(
      (a, b) => (a.sortingWeight ?? 0) - (b.sortingWeight ?? 0)
    );
  }

  const initialTabId =
    items.find(item => item.id === hashFromUrl && !item.mobileOnly)?.id ??
    items[0]?.id;

  const desktopTabs = [...items].filter(item => !item.mobileOnly);
  const [activeTabId, setActiveTabId] = useState(initialTabId);
  const [isScrolling, setIsScrolling] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const mobileLinksRef = useRef<Record<string, HTMLAnchorElement | null>>({});
  const desktopNavRef = useRef<HTMLElement>(null);
  const desktopButtonsRef = useRef<Record<string, HTMLButtonElement | null>>(
    {}
  );
  const [thumb, setThumb] = useState<{
    visible: boolean;
    widthPct: number;
    leftPct: number;
  }>({ visible: false, widthPct: 0, leftPct: 0 });

  useEffect(() => {
    const nav = desktopNavRef.current;
    if (!nav) return;

    const update = () => {
      if (nav.scrollWidth <= nav.clientWidth) {
        setThumb(prev => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }
      setThumb({
        visible: true,
        widthPct: (nav.clientWidth / nav.scrollWidth) * 100,
        leftPct: (nav.scrollLeft / nav.scrollWidth) * 100,
      });
    };

    update();
    nav.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(nav);
    return () => {
      nav.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [items]);

  const dragRef = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: false,
  });

  const handleDesktopPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const nav = desktopNavRef.current;
    if (!nav) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: nav.scrollLeft,
      moved: false,
    };

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current.active) return;
      const dx = ev.clientX - dragRef.current.startX;
      if (Math.abs(dx) > 4) dragRef.current.moved = true;
      nav.scrollLeft = dragRef.current.startScroll - dx;
    };

    const onUp = () => {
      dragRef.current.active = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const tab = items.find(item => item.id === hash);
      if (tab) {
        setIsScrolling(true);
        setActiveTabId(tab.id);
        setTimeout(() => setIsScrolling(false), 1000);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [items]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 1024 || isScrolling) return;

      const sections = items
        .map(item => document.querySelector(`[data-tab-id="${item.id}"]`))
        .filter(Boolean) as HTMLElement[];

      const scrollPosition = window.scrollY - 300;
      const scrollMargin = 74; // matches scroll-my-16 (16 * 4px) + 10px padding

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        // Account for scroll margin when determining active section
        if (section.offsetTop + scrollMargin <= scrollPosition) {
          const tabId = section.getAttribute("data-tab-id");
          if (tabId && tabId !== activeTabId) {
            setActiveTabId(tabId);
            window.history.replaceState(null, "", `#${tabId}`);
          }
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [items, activeTabId, isScrolling]);

  useEffect(() => {
    const centerInScroller = (
      el: HTMLElement | null,
      scroller: HTMLElement | null
    ) => {
      if (!el || !scroller) return;
      const elRect = el.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      const offset =
        elRect.left +
        elRect.width / 2 -
        (scrollerRect.left + scrollerRect.width / 2);
      scroller.scrollTo({
        left: scroller.scrollLeft + offset,
        behavior: "smooth",
      });
    };
    centerInScroller(mobileLinksRef.current[activeTabId], mobileNavRef.current);
    centerInScroller(
      desktopButtonsRef.current[activeTabId],
      desktopNavRef.current
    );
  }, [activeTabId]);

  const handleTabClick = (tabId: string, pushState: boolean) => {
    setActiveTabId(tabId);

    if (pushState) {
      window.history.pushState(null, "", `#${tabId}`);
    }
  };

  const activeTab = items.find(item => item.id === activeTabId) ?? items[0];

  return (
    <>
      {/* Floating top navigation menu */}
      <div className="fixed top-12 z-20 left-0 w-full bg-black pt-4 lg:hidden border-b border-t-neutral-400">
        <div className="relative">
          <div
            ref={mobileNavRef}
            className="overflow-x-auto scrollbar-hide py-2 pl-6 pr-8"
          >
            <div className="flex gap-x-5 justify-between">
              {items.map(item => (
                <Link
                  ref={el => {
                    mobileLinksRef.current[item.id] = el;
                  }}
                  key={`tab-top-navigation-${item.label}-${item.id}`}
                  href={`#${item.id}`}
                  onClick={() => handleTabClick(item.id, false)}
                  className={`text-neutral-400 hover:text-neutral-600 text-sm uppercase tracking-wide border-b border-b-transparent whitespace-nowrap
                ${activeTabId === item.id && "!text-neutral-100 !border-b-blue-500"}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black to-transparent" />
        </div>
      </div>

      {/* Desktop tabs */}
      <section>
        {heading && (
          <h2 className="text-3xl font-bold mb-8 text-gray-900">{heading}</h2>
        )}

        <div className="hidden lg:block border-b-2 border-neutral-700 relative group">
          <nav
            ref={desktopNavRef}
            className="flex space-x-8 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
            aria-label="Tabs"
            onPointerDown={handleDesktopPointerDown}
          >
            {desktopTabs.map(item => (
              <button
                ref={el => {
                  desktopButtonsRef.current[item.id] = el;
                }}
                key={item.id}
                onClick={e => {
                  if (dragRef.current.moved) {
                    e.preventDefault();
                    return;
                  }
                  handleTabClick(item.id, true);
                }}
                className={`whitespace-nowrap py-4 px-3 border-b-2 font-medium font-heading transition-colors text-2xl tracking-wider uppercase ${
                  activeTabId === item.id
                    ? "border-blue-500 text-neutral-200 backdrop-blur-lg rounded-t-md"
                    : "border-transparent text-neutral-950 hover:text-neutral-900 [text-shadow:0_0px_10px_rgba(255,255,255,0.2)] hover:border-neutral-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          {thumb.visible && (
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-1 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <div
                className="h-full bg-white/30 rounded-full"
                style={{
                  width: `${thumb.widthPct}%`,
                  marginLeft: `${thumb.leftPct}%`,
                }}
              />
            </div>
          )}
        </div>

        <div className="hidden lg:block mt-8 max-w-none w-full">
          <InnerPage style={{ backgroundColor }}>
            {activeTab?.content}
          </InnerPage>
        </div>
      </section>

      {/* Mobile expanded content */}
      <section>
        <div className="lg:hidden space-y-6">
          {items.map(item => (
            <div
              key={item.id}
              className="first:pt-0 pt-28 scroll-my-16"
              id={!item.hideTitle ? item.id : undefined}
              data-tab-id={item.id}
            >
              {!item.hideTitle && (
                <h3 className="text-5xl font-heading tracking-wider text-neutral-400 mb-6">
                  {item.label}
                </h3>
              )}
              <InnerPage style={{ backgroundColor }}>
                <div className="max-w-none">{item.content}</div>
              </InnerPage>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
