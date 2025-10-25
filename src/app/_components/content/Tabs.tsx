"use client";

import { useState, useEffect } from "react";
import InnerPage from "@/app/_components/content/InnerPage";

export interface TabItem {
  label: string;
  id: string;
  content: React.ReactNode;
  sortingWeight?: number;
}

export interface TabsProps {
  heading?: string;
  items: TabItem[];
  sortByWeight?: boolean;
}

export default function Tabs({
  heading,
  items,
  sortByWeight = false,
}: TabsProps) {
  const hashFromUrl =
    typeof window !== "undefined" ? window.location.hash.slice(1) : "";

  if (sortByWeight) {
    items = items.sort(
      (a, b) => (a.sortingWeight ?? 0) - (b.sortingWeight ?? 0)
    );
  }

  const initialTab = items.findIndex(item => item.id === hashFromUrl);
  const [activeIndex, setActiveIndex] = useState(
    initialTab >= 0 ? initialTab : 0
  );

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const tabIndex = items.findIndex(item => item.id === hash);
      if (tabIndex >= 0) {
        setActiveIndex(tabIndex);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [items]);

  const handleTabClick = (index: number) => {
    setActiveIndex(index);
    const tabId = items[index].id;
    window.history.pushState(null, "", `#${tabId}`);
  };

  return (
    <div className="">
      {heading && (
        <h2 className="text-3xl font-bold mb-8 text-gray-900">{heading}</h2>
      )}

      <div className="hidden lg:block border-b-2 border-neutral-700">
        <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(index)}
              className={`whitespace-nowrap py-4 px-3 border-b-2 font-medium font-heading transition-colors text-2xl tracking-wider uppercase ${
                activeIndex === index
                  ? "border-blue-500 text-neutral-200"
                  : "border-transparent text-neutral-950 hover:text-neutral-800 [text-shadow:0_0px_1px_rgba(255,255,255,0.4)] hover:border-neutral-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="hidden lg:block mt-8 max-w-none">
        <InnerPage>{items[activeIndex]?.content}</InnerPage>
      </div>

      <div className="lg:hidden space-y-6">
        {items.map(item => (
          <div key={item.id} className="pb-20 first:pt-0 pt-20">
            <InnerPage>
              <h3 className="text-4xl font-bold font-heading tracking-wider text-neutral-200 mb-4">
                {item.label}
              </h3>
              <div className="max-w-none">{item.content}</div>
            </InnerPage>
          </div>
        ))}
      </div>
    </div>
  );
}
