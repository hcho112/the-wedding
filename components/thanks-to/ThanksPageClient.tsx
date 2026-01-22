"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useAudio } from "@/context/AudioContext";
import AudioPlayer from "@/components/audio/AudioPlayer";

interface ThanksPageClientProps {
  children: React.ReactNode;
}

export default function ThanksPageClient({ children }: ThanksPageClientProps) {
  const { playTrack, stopAudio } = useAudio();
  const initializedRef = useRef(false);
  const stopAudioRef = useRef(stopAudio);

  // Keep stopAudio ref updated
  useEffect(() => {
    stopAudioRef.current = stopAudio;
  }, [stopAudio]);

  // Play bridal party track on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    playTrack("Bridal Party");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop audio on unmount (uses stopAudio to avoid setting userPaused flag)
  useEffect(() => {
    return () => {
      stopAudioRef.current();
    };
  }, []);

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-sm px-4 py-6 sm:px-6">
        <div className="max-w-[1080px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl sm:text-3xl font-light tracking-[0.1em]">
              Thanks To
            </h1>
            <p className="text-white/70 text-sm sm:text-base font-light mt-1 tracking-wide">
              Our Bridal Party
            </p>
          </div>
          <div className="flex items-center gap-4">
            <AudioPlayer />
            <Link
              href="/"
              className="flex items-center gap-2 text-white/70 hover:text-white text-base sm:text-lg font-light tracking-wide transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="sm:w-6 sm:h-6"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </Link>
          </div>
        </div>
      </header>

      {children}
    </main>
  );
}
