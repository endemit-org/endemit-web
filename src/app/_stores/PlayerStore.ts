import { create } from "zustand";

export interface Track {
  url: string;
  title: string;
  type: "track" | "episode";
  image?: string;
  artist?: string;
}

interface PlayerState {
  currentTrack: Track | null;
  isVisible: boolean;
  isExpanded: boolean;

  loadTrack: (track: Track) => void;
  close: () => void;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
}

export const usePlayerStore = create<PlayerState>(set => ({
  currentTrack: null,
  isVisible: false,
  isExpanded: false,

  loadTrack: track =>
    set({
      currentTrack: track,
      isVisible: true,
      isExpanded: false,
    }),

  close: () =>
    set({
      isVisible: false,
      currentTrack: null,
      isExpanded: false,
    }),

  toggleExpanded: () => set(state => ({ isExpanded: !state.isExpanded })),

  setExpanded: expanded => set({ isExpanded: expanded }),
}));
