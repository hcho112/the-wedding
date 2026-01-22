"use client";

import { useAudio } from "@/context/AudioContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// Volume icon component based on level
function VolumeIcon({ volume, isMuted }: { volume: number; isMuted: boolean }) {
  if (isMuted || volume === 0) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  }

  if (volume < 0.5) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    );
  }

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

// Play icon
function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

// Pause icon
function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

// Minimalistic audio bars animation
function AudioBars({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={
            isPlaying
              ? {
                  scaleY: [0.3, 1, 0.5, 0.8, 0.3],
                  transition: {
                    duration: 0.8 + i * 0.1,
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                  },
                }
              : {
                  scaleY: 0.3,
                  transition: { duration: 0.3 },
                }
          }
          className="w-[2px] h-full bg-white/70 origin-bottom rounded-full"
          style={{ originY: 1 }}
        />
      ))}
    </div>
  );
}

export default function AudioPlayer() {
  const { state, togglePlay, setVolume, toggleMute } = useAudio();
  const [showVolume, setShowVolume] = useState(false);

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  // Determine if audio is actually playing (not muted and isPlaying)
  const isActuallyPlaying = state.isPlaying && !state.isMuted;

  return (
    <div
      className="flex items-center gap-2"
      onMouseEnter={() => setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
    >
      {/* Audio visualization bars - shows when playing */}
      <div className="hidden sm:block">
        <AudioBars isPlaying={isActuallyPlaying} />
      </div>

      {/* Track title with animated transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.trackTitle}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="hidden sm:flex items-center gap-1.5 text-white/60 text-xs max-w-[120px]"
        >
          <span className="truncate">{state.trackTitle}</span>
        </motion.div>
      </AnimatePresence>

      {/* Play/Pause Button with subtle glow when playing */}
      <motion.div
        animate={{
          boxShadow: isActuallyPlaying
            ? "0 0 12px rgba(255,255,255,0.2)"
            : "0 0 0px rgba(255,255,255,0)",
        }}
        transition={{ duration: 0.3 }}
        className="rounded-full"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          aria-label={state.isPlaying ? "Pause" : "Play"}
        >
          {state.isPlaying ? <PauseIcon /> : <PlayIcon />}
        </Button>
      </motion.div>

      {/* Volume Control */}
      <div className="relative flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
          aria-label={state.isMuted ? "Unmute" : "Mute"}
        >
          <VolumeIcon volume={state.volume} isMuted={state.isMuted} />
        </Button>

        {/* Volume Slider - Shows on hover */}
        <AnimatePresence>
          {showVolume && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 80 }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <div className="w-20 px-2">
                <Slider
                  value={[state.isMuted ? 0 : state.volume * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer [&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-range]]:bg-white/70 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:w-2.5 [&_[data-slot=slider-thumb]]:h-2.5"
                  aria-label="Volume"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
