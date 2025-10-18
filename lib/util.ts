import { EventProps } from "@/components/event/EventCard";
import events from "@/config/events.config";
import { PrismicRichTextBlock } from "@/domain/cms/types/prismic";
import { Country } from "@/types/country";
import { ProductCategory } from "@/domain/product/types/product";
import { getCountry } from "@/domain/checkout/actions";

export const getTimeUntil = (currentTime: Date, date: Date) => {
  const diff = date.getTime() - currentTime.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 10) {
    return null;
  } else if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  } else {
    return `in ${minutes}m`;
  }
};

export const getEventConfigById = (id: string): EventProps | undefined => {
  return events.find(
    (event: EventProps) => event.id.toLowerCase() === id.toLowerCase()
  );
};

export function richTextToPlainText(richText: PrismicRichTextBlock[]): string {
  return richText.map(block => block.text).join("\n");
}

export function richTextToHTML(richText: PrismicRichTextBlock[]): string {
  return richText
    .map(block => {
      let text = block.text;

      // Apply spans (formatting)
      const sortedSpans = [...block.spans].sort((a, b) => b.start - a.start);
      sortedSpans.forEach(span => {
        const before = text.slice(0, span.start);
        const content = text.slice(span.start, span.end);
        const after = text.slice(span.end);

        switch (span.type) {
          case "strong":
            text = `${before}<strong>${content}</strong>${after}`;
            break;
          case "em":
            text = `${before}<em>${content}</em>${after}`;
            break;
          case "hyperlink":
            text = `${before}<a href="${span.data?.url}">${content}</a>${after}`;
            break;
        }
      });

      // Wrap in appropriate tag
      switch (block.type) {
        case "heading4":
          return `<h4>${text}</h4>`;
        case "list-item":
          return `<li>${text}</li>`;
        case "o-list-item":
          return `<li>${text}</li>`;
        default:
          return `<p>${text}</p>`;
      }
    })
    .join("");
}

export const getRegionFromCountry = (country: Country) => {
  const countryData = getCountry(country);

  if (countryData) {
    return countryData.region;
  } else {
    return null;
  }
};

export const createSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
};

export const categoriesWithSlugs = Object.values(ProductCategory).map(
  category => ({
    name: category,
    slug: createSlug(category),
  })
);

export const categoryFromSlug = (slug: string) => {
  const category = categoriesWithSlugs.find(cat => cat.slug === slug);
  return category ? category.name : null;
};

export const ensureDateType = (date: string | Date): Date => {
  return date instanceof Date ? date : new Date(date);
};

export const transformGramToKilogram = (grams: number) => {
  return grams / 1000;
};

export const transformKilogramToGram = (kilograms: number) => {
  return Math.round(kilograms * 1000);
};

export const transformSecondsToMs = (seconds: number) => {
  return seconds * 1000;
};

export const transformMinutesToMs = (minutes: number) => {
  return minutes * 60 * 1000;
};

export const transformHoursToMs = (hours: number) => {
  return hours * 60 * 60 * 1000;
};

export const getStatusText = (status: string) => {
  return status.replace("_", " ").toLowerCase();
};
