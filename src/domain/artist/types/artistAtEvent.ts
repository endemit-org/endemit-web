import { Artist } from "@/domain/artist/types/artist";

export type ArtistAtEvent = Artist & {
  start_time: Date | null;
  end_time: Date | null;
  duration: number;
  stage: string | null;
};
