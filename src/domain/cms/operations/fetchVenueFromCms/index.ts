import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformVenueObject } from "@/domain/venue/transformers/transformVenueObject";
import type { AppLocale } from "@/i18n/routing";

export const fetchVenueFromCms = async (
  venueUid: string,
  locale: AppLocale = "sl"
) => {
  const prismicVenue = await prismicClient
    .getByUID("venue", venueUid)
    .catch(() => null);

  if (!prismicVenue) {
    return null;
  }

  return await transformVenueObject(prismicVenue, locale);
};
