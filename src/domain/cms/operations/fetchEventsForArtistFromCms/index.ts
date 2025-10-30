import "server-only";

import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";

export const fetchEventsForArtistFromCms = async (artistId: string) => {
  const events = await fetchEventsFromCms({});

  if (!events) {
    return null;
  }

  return events.filter(
    event =>
      event.artists.some(artist => artist.id === artistId) ||
      event.artists.some(
        artist =>
          artist.isB2b &&
          artist.b2bAttribution &&
          artist.b2bAttribution.some(b2b => b2b.id === artistId)
      )
  );
};
