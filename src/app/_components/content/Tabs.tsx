"use client";

import { useState, useEffect } from "react";
import InnerPage from "@/app/_components/content/InnerPage";
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

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.offsetTop <= scrollPosition) {
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
      <div
        className={
          "fixed top-14 z-20 left-0 w-full p-2 bg-neutral-950 lg:hidden px-4 border-t border-t-neutral-800 overflow-y-auto"
        }
      >
        <div className={"flex gap-x-3"}>
          {items.map(item => (
            <Link
              key={`tab-top-navigation-${item.label}-${item.id}`}
              href={`#${item.id}`}
              onClick={() => handleTabClick(item.id, false)}
              className={`text-neutral-400 hover:text-neutral-600 text-sm uppercase tracking-wide border-b border-b-transparent
                ${activeTabId === item.id && "!text-neutral-100 !border-b-blue-500"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop tabs */}
      <section>
        {heading && (
          <h2 className="text-3xl font-bold mb-8 text-gray-900">{heading}</h2>
        )}

        <div className="hidden lg:block border-b-2 border-neutral-700">
          <nav className="flex space-x-8 overflow-x-auto " aria-label="Tabs">
            {desktopTabs.map(item => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id, true)}
                className={`whitespace-nowrap py-4 px-3 border-b-2 font-medium font-heading transition-colors text-2xl tracking-wider uppercase ${
                  activeTabId === item.id
                    ? "border-blue-500 text-neutral-200"
                    : "border-transparent text-neutral-950 hover:text-neutral-800 [text-shadow:0_0px_1px_rgba(255,255,255,0.4)] hover:border-neutral-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
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
              className="first:pt-0 pt-28"
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
