"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { SoundManifest } from "@/types";

interface AudioState {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentCategory: string | null;
  trackTitle: string | null;
}

interface AudioContextType {
  state: AudioState;
  play: () => void;
  pause: () => void;
  stopAudio: () => void; // For cleanup - doesn't affect userPaused preference
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  switchToCategory: (category: string) => void;
  playTrack: (title: string) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

// LocalStorage keys
const VOLUME_KEY = "wedding-audio-volume";
const MUTED_KEY = "wedding-audio-muted";
const SOUND_MANIFEST_PATH = "/sound-manifest.json";

// Fallback tracks when manifest is not available
const FALLBACK_TRACKS: Record<string, { url: string; title: string }> = {
  "Preparation 10AM": {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    title: "Morning Preparations",
  },
  "First Look 1PM": {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    title: "First Look",
  },
  "Ceremony 2PM": {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    title: "The Ceremony",
  },
  "Family Photos 3PM": {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    title: "Family Moments",
  },
  "Reception 5PM": {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    title: "Reception Party",
  },
  "Dancing 7PM": {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    title: "Dance Floor",
  },
};

export function AudioProvider({ children }: { children: ReactNode }) {
  const [manifest, setManifest] = useState<SoundManifest | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const userPausedRef = useRef(false);
  const interactionHandlerRef = useRef<(() => void) | null>(null);
  const pendingTrackRef = useRef<string | null>(null); // Store pending track request for when manifest loads

  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    volume: 0.5,
    isMuted: false,
    currentCategory: null,
    trackTitle: null,
  });

  // Get track for a category
  const getTrackForCategory = useCallback(
    (category: string): { url: string; title: string } => {
      if (manifest && manifest.tracks.length > 0) {
        // Try exact category match
        const exactMatch = manifest.tracks.find((t) => t.category === category);
        if (exactMatch?.url) {
          return { url: exactMatch.url, title: exactMatch.title };
        }

        // Try partial match (category name without time)
        const categoryBase = category
          .replace(/\s+\d{1,2}(AM|PM)$/i, "")
          .toLowerCase();

        const partialMatch = manifest.tracks.find((t) => {
          const trackBase = t.category
            .replace(/\s+\d{1,2}(AM|PM)$/i, "")
            .toLowerCase();
          return trackBase === categoryBase;
        });
        if (partialMatch?.url) {
          return { url: partialMatch.url, title: partialMatch.title };
        }

        // Try title match
        const titleMatch = manifest.tracks.find(
          (t) => t.title.toLowerCase() === categoryBase
        );
        if (titleMatch?.url) {
          return { url: titleMatch.url, title: titleMatch.title };
        }

        // Return first track as fallback
        if (manifest.tracks[0]?.url) {
          return { url: manifest.tracks[0].url, title: manifest.tracks[0].title };
        }
      }

      // Use fallback tracks
      if (FALLBACK_TRACKS[category]) {
        return FALLBACK_TRACKS[category];
      }

      // Try partial match in fallbacks
      const categoryBase = category
        .replace(/\s+\d{1,2}(AM|PM)$/i, "")
        .toLowerCase();
      for (const [key, track] of Object.entries(FALLBACK_TRACKS)) {
        const keyBase = key.replace(/\s+\d{1,2}(AM|PM)$/i, "").toLowerCase();
        if (keyBase === categoryBase) {
          return track;
        }
      }

      // Default fallback
      return FALLBACK_TRACKS["Preparation 10AM"];
    },
    [manifest]
  );

  // Helper to remove interaction listeners
  const removeInteractionListeners = useCallback(() => {
    const handler = interactionHandlerRef.current;
    if (handler) {
      document.removeEventListener("click", handler);
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("scroll", handler);
      document.removeEventListener("keydown", handler);
      interactionHandlerRef.current = null;
    }
  }, []);

  // Helper to set up interaction listeners for autoplay fallback
  // These listeners persist until audio plays successfully or user pauses
  const setupInteractionListeners = useCallback(() => {
    // Don't set up duplicate listeners
    if (interactionHandlerRef.current) return;

    const audio = audioRef.current;
    if (!audio) return;

    const playOnInteraction = () => {
      if (audio.src && !userPausedRef.current) {
        audio.play().then(() => {
          // Success! Remove all listeners
          removeInteractionListeners();
        }).catch(() => {
          // Still blocked, keep listeners active
        });
      }
    };

    interactionHandlerRef.current = playOnInteraction;

    // Add listeners
    document.addEventListener("click", playOnInteraction);
    document.addEventListener("touchstart", playOnInteraction);
    document.addEventListener("scroll", playOnInteraction, { passive: true });
    document.addEventListener("keydown", playOnInteraction);
  }, [removeInteractionListeners]);

  // Load manifest on mount
  useEffect(() => {
    fetch(SOUND_MANIFEST_PATH)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: SoundManifest) => {
        setManifest(data);
      })
      .catch(() => {
        // Use fallback tracks if manifest not available
      });
  }, []);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    // Restore volume/mute preferences
    const savedVolume = localStorage.getItem(VOLUME_KEY);
    const savedMuted = localStorage.getItem(MUTED_KEY);

    const volume = savedVolume ? Math.max(0, Math.min(1, parseFloat(savedVolume))) : 0.5;
    const muted = savedMuted === "true";

    audio.volume = volume;
    audio.muted = muted;
    userPausedRef.current = false;

    setState((prev) => ({
      ...prev,
      volume,
      isMuted: muted,
    }));

    // Event listeners for state sync
    const handlePlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Try to play audio, with fallback to user interaction
  const tryPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src || userPausedRef.current) return;

    audio.play().then(() => {
      // Success - remove any active listeners
      removeInteractionListeners();
    }).catch(() => {
      // Autoplay blocked - set up interaction listeners
      setupInteractionListeners();
    });
  }, [setupInteractionListeners, removeInteractionListeners]);

  const play = useCallback(() => {
    userPausedRef.current = false;
    tryPlay();
  }, [tryPlay]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    userPausedRef.current = true;
    audio.pause();
  }, []);

  // Stop audio without affecting userPaused preference - for component cleanup
  // This prevents React Strict Mode double-mount from corrupting state
  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const setVolume = useCallback((volume: number) => {
    const audio = audioRef.current;
    const clampedVolume = Math.max(0, Math.min(1, volume));

    if (audio) {
      audio.volume = clampedVolume;
      if (clampedVolume > 0 && audio.muted) {
        audio.muted = false;
        setState((prev) => ({ ...prev, isMuted: false }));
        localStorage.setItem(MUTED_KEY, "false");
      }
    }

    setState((prev) => ({ ...prev, volume: clampedVolume }));
    localStorage.setItem(VOLUME_KEY, clampedVolume.toString());
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const newMuted = !audio.muted;
    audio.muted = newMuted;
    setState((prev) => ({ ...prev, isMuted: newMuted }));
    localStorage.setItem(MUTED_KEY, newMuted.toString());
  }, []);

  // Switch to a new category track
  const switchToCategory = useCallback(
    (category: string) => {
      const audio = audioRef.current;
      if (!audio) return;

      const track = getTrackForCategory(category);

      // Don't reload if same track
      if (currentUrlRef.current === track.url) {
        setState((prev) => ({ ...prev, currentCategory: category }));
        return;
      }

      // Update state
      setState((prev) => ({
        ...prev,
        currentCategory: category,
        trackTitle: track.title,
      }));

      // Load new track
      currentUrlRef.current = track.url;
      audio.src = track.url;
      audio.currentTime = 0;

      // Try to play if not paused
      if (!userPausedRef.current) {
        tryPlay();
      }
    },
    [getTrackForCategory, tryPlay]
  );

  // Internal function to actually play a track (called when manifest is ready)
  const playTrackInternal = useCallback(
    (title: string, manifestData: SoundManifest) => {
      const audio = audioRef.current;
      if (!audio) return;

      // Find track by title in manifest
      const found = manifestData.tracks.find(
        (t) => t.title.toLowerCase() === title.toLowerCase()
      );

      if (!found?.url) return;

      const track = { url: found.url, title: found.title };

      // Don't reload if same track
      if (currentUrlRef.current === track.url) {
        if (!userPausedRef.current) {
          tryPlay();
        }
        return;
      }

      // Update state
      setState((prev) => ({
        ...prev,
        currentCategory: null,
        trackTitle: track.title,
      }));

      // Load new track
      currentUrlRef.current = track.url;
      audio.src = track.url;
      audio.currentTime = 0;

      // Try to play
      if (!userPausedRef.current) {
        tryPlay();
      }
    },
    [tryPlay]
  );

  // Play a specific track by title (for pages like Thanks that need a specific song)
  const playTrack = useCallback(
    (title: string) => {
      // If manifest not loaded yet, store request for later
      if (!manifest || manifest.tracks.length === 0) {
        pendingTrackRef.current = title;
        return;
      }

      playTrackInternal(title, manifest);
    },
    [manifest, playTrackInternal]
  );

  // Process pending track request when manifest loads
  useEffect(() => {
    if (manifest && manifest.tracks.length > 0 && pendingTrackRef.current) {
      const pendingTitle = pendingTrackRef.current;
      pendingTrackRef.current = null;
      playTrackInternal(pendingTitle, manifest);
    }
  }, [manifest, playTrackInternal]);

  return (
    <AudioContext.Provider
      value={{
        state,
        play,
        pause,
        stopAudio,
        togglePlay,
        setVolume,
        toggleMute,
        switchToCategory,
        playTrack,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
