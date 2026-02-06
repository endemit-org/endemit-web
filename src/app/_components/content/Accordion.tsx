"use client";

import { useState } from "react";
import ItemToggleIcon from "@/app/_components/icon/ItemToggleIcon";

export interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  heading?: string;
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpenIndex?: number;
  compact?: boolean;
}

export default function Accordion({
  heading,
  items,
  allowMultiple = false,
  defaultOpenIndex,
  compact = false,
}: AccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>(
    defaultOpenIndex !== undefined ? [defaultOpenIndex] : []
  );

  const toggleItem = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    } else {
      setOpenIndexes(prev => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div className={compact ? "w-full" : "w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"}>
      {heading && (
        <h2 className={compact ? "text-xl font-bold mb-4 text-neutral-200" : "text-3xl font-bold mb-8 text-gray-900"}>{heading}</h2>
      )}

      <div className={compact ? "space-y-2" : "space-y-4"}>
        {items.map((item, index) => {
          const isOpen = openIndexes.includes(index);

          return (
            <div
              key={index}
              className="border-2 border-neutral-800 rounded-sm overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className={`w-full flex items-center justify-between ${compact ? "p-4" : "p-6"} text-left bg-neutral-800 hover:bg-neutral-700 transition-colors`}
              >
                <span className={`${compact ? "text-base" : "text-lg"} font-semibold text-neutral-200`}>
                  {item.title}
                </span>
                <ItemToggleIcon isOpen={isOpen} />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300  ${
                  isOpen ? "max-h-[600px]" : "max-h-0"
                }`}
              >
                <div className={`${compact ? "p-4" : "p-6"} text-neutral-800 bg-neutral-200 prose max-w-none`}>
                  {item.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
