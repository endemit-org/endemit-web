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
  isPlaying: boolean;
  hasHydrated: boolean;

  hydrate: () => void;
  loadTrack: (track: Track) => void;
  close: () => void;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
}

// localStorage keys
const STORAGE_KEY_TRACK = "endemit-player-track";
const STORAGE_KEY_PLAYSTATE = "endemit-player-playstate";

// Helper functions for localStorage
const getStoredTrack = (): Track | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TRACK);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const getStoredPlayState = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PLAYSTATE);
    return stored === "true";
  } catch {
    return false;
  }
};

const storeTrack = (track: Track | null) => {
  if (typeof window === "undefined") return;
  try {
    if (track) {
      localStorage.setItem(STORAGE_KEY_TRACK, JSON.stringify(track));
    } else {
      localStorage.removeItem(STORAGE_KEY_TRACK);
    }
  } catch {
    // Silently fail if localStorage is not available
  }
};

const storePlayState = (isPlaying: boolean) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PLAYSTATE, String(isPlaying));
  } catch {
    // Silently fail if localStorage is not available
  }
};

const clearStorage = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_TRACK);
    localStorage.removeItem(STORAGE_KEY_PLAYSTATE);
  } catch {
    // Silently fail if localStorage is not available
  }
};

export const usePlayerStore = create<PlayerState>(set => ({
  // Initialize with null - will be hydrated from localStorage on client
  currentTrack: null,
  isVisible: false,
  isExpanded: false,
  isPlaying: false,
  hasHydrated: false,

  hydrate: () => {
    const storedTrack = getStoredTrack();
    set({
      currentTrack: storedTrack,
      isVisible: storedTrack !== null,
      hasHydrated: true,
    });
  },

  loadTrack: track => {
    storeTrack(track);
    set({
      currentTrack: track,
      isVisible: true,
      isExpanded: false,
    });
  },

  close: () => {
    clearStorage();
    set({
      isVisible: false,
      currentTrack: null,
      isExpanded: false,
      isPlaying: false,
    });
  },

  toggleExpanded: () => set(state => ({ isExpanded: !state.isExpanded })),

  setExpanded: expanded => set({ isExpanded: expanded }),

  setIsPlaying: isPlaying => {
    storePlayState(isPlaying);
    set({ isPlaying });
  },
}));

// Export stored play state for initial load
export { getStoredPlayState };
