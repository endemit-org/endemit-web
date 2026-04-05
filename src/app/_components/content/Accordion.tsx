"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ItemToggleIcon from "@/app/_components/icon/ItemToggleIcon";

export interface AccordionItem {
  title: string | React.ReactNode;
  content: React.ReactNode;
}

export interface AccordionProps {
  heading?: string;
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpenIndex?: number;
  compact?: boolean;
  autoExpandIndexOnView?: number;
  autoExpandDelay?: number;
}

export default function Accordion({
  heading,
  items,
  allowMultiple = false,
  defaultOpenIndex,
  compact = false,
  autoExpandIndexOnView,
  autoExpandDelay = 1000,
}: AccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>(
    defaultOpenIndex !== undefined ? [defaultOpenIndex] : []
  );
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInViewRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to attempt auto-expand when conditions are met
  const tryAutoExpand = useCallback(() => {
    if (hasAutoExpanded || autoExpandIndexOnView === undefined) return;

    // Clear any existing expand timeout
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }

    // Only start timer if in view
    if (isInViewRef.current) {
      expandTimeoutRef.current = setTimeout(() => {
        // Only auto-expand if no item is currently selected
        setOpenIndexes(current => {
          if (current.length === 0) {
            setHasAutoExpanded(true);
            return [autoExpandIndexOnView];
          }
          // User already selected something, don't override
          setHasAutoExpanded(true); // Prevent future auto-expand attempts
          return current;
        });
      }, autoExpandDelay);
    }
  }, [autoExpandDelay, autoExpandIndexOnView, hasAutoExpanded]);

  // Track scroll state - cancel and restart expand timer on scroll
  useEffect(() => {
    if (
      autoExpandIndexOnView === undefined ||
      hasAutoExpanded ||
      items.length <= 1
    )
      return;

    const handleScroll = () => {
      // Cancel expand timer while scrolling
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
        expandTimeoutRef.current = null;
      }

      // Reset scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // After scroll stops, try to auto-expand
      scrollTimeoutRef.current = setTimeout(() => {
        tryAutoExpand();
      }, 150); // 150ms after scroll stops
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
      }
    };
  }, [autoExpandIndexOnView, hasAutoExpanded, items.length, tryAutoExpand]);

  // Auto-expand specified item when it comes into view and user stops scrolling
  useEffect(() => {
    if (
      autoExpandIndexOnView === undefined ||
      hasAutoExpanded ||
      items.length <= 1
    )
      return;

    const observer = new IntersectionObserver(
      entries => {
        isInViewRef.current = entries[0].isIntersecting;

        if (entries[0].isIntersecting && !hasAutoExpanded) {
          // Start expand timer (will be cancelled if user scrolls)
          tryAutoExpand();
        } else {
          // Cancel timer if element leaves view
          if (expandTimeoutRef.current) {
            clearTimeout(expandTimeoutRef.current);
            expandTimeoutRef.current = null;
          }
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [autoExpandIndexOnView, hasAutoExpanded, items.length, tryAutoExpand]);

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
    <div
      ref={containerRef}
      className={
        compact
          ? "w-full"
          : "w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      }
    >
      {heading && (
        <h2
          className={
            compact
              ? "text-xl font-bold mb-4 text-neutral-200"
              : "text-3xl font-bold mb-8 text-gray-900"
          }
        >
          {heading}
        </h2>
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
                className={`w-full flex items-center justify-between ${compact ? "p-4" : "p-6"} text-left transition-colors ${
                  isOpen
                    ? "bg-black text-neutral-100 border-b-2 border-dotted border-b-neutral-600"
                    : "bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
                }`}
              >
                <span className={`${compact ? "text-base" : "text-lg"}  `}>
                  {item.title}
                </span>
                <ItemToggleIcon isOpen={isOpen} />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300  ${
                  isOpen ? "max-h-[1000px]" : "max-h-0"
                }`}
              >
                <div
                  className={`${compact ? "p-4" : "p-6"} bg-neutral-950 bg-opacity-50`}
                >
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
