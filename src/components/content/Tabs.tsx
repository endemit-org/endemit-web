"use client";

import { useState, useEffect } from "react";

export interface TabItem {
  label: string;
  id: string;
  content: React.ReactNode;
}

export interface TabsProps {
  heading?: string;
  items: TabItem[];
}

export default function Tabs({ heading, items }: TabsProps) {
  const hashFromUrl =
    typeof window !== "undefined" ? window.location.hash.slice(1) : "";

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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {heading && (
        <h2 className="text-3xl font-bold mb-8 text-gray-900">{heading}</h2>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(index)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeIndex === index
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-8 prose max-w-none">{items[activeIndex]?.content}</div>
    </div>
  );
}
