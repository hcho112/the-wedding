"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import Image from "next/image";
import type { PhotoManifest } from "@/types";
import { markImageLoaded } from "@/lib/image-cache";

type LightboxProps = {
  photo: PhotoManifest;
  originRect: DOMRect;
  exitRect: DOMRect | null; // For animating back to current photo's grid position
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  hasPrev: boolean;
  hasNext: boolean;
};

export default function Lightbox({
  photo,
  originRect,
  exitRect,
  onClose,
  onNavigate,
  hasPrev,
  hasNext,
}: LightboxProps) {
  // Use exitRect for exit animation if available, otherwise fall back to originRect
  const targetExitRect = exitRect || originRect;

  // Initialize with actual viewport dimensions to avoid animation glitch
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
  }));
  const [isHoveringNav, setIsHoveringNav] = useState<"left" | "right" | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dragX, setDragX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close on escape key, navigate on arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrev) {
        onNavigate("prev");
      } else if (e.key === "ArrowRight" && hasNext) {
        onNavigate("next");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNavigate, hasPrev, hasNext]);

  // Use desktop or full variant for lightbox
  const fullUrl = photo.variants.desktop?.url || photo.variants.full?.url || photo.url;

  const handleLoad = () => {
    markImageLoaded(fullUrl);
  };

  // Calculate final size maintaining aspect ratio
  const calculateFinalSize = () => {
    const maxW = viewport.width * 0.9;
    const maxH = viewport.height * 0.9;
    const ratio = photo.width / photo.height;

    let finalW = maxW;
    let finalH = finalW / ratio;

    if (finalH > maxH) {
      finalH = maxH;
      finalW = finalH * ratio;
    }

    return { width: finalW, height: finalH };
  };

  const finalSize = calculateFinalSize();

  // Calculate center position
  const centerX = (viewport.width - finalSize.width) / 2;
  const centerY = (viewport.height - finalSize.height) / 2;

  // Handle swipe/drag end for mobile
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = 0.5;

    if (info.offset.x > threshold || info.velocity.x > velocity) {
      if (hasPrev) {
        onNavigate("prev");
      }
    } else if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      if (hasNext) {
        onNavigate("next");
      }
    }
    setDragX(0);
  };

  // Navigation arrow SVG
  const ArrowIcon = ({ direction }: { direction: "left" | "right" }) => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={direction === "right" ? "rotate-180" : ""}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );

  // Handle navigation zone click (prevent closing lightbox)
  const handleNavClick = (e: React.MouseEvent, direction: "prev" | "next") => {
    e.stopPropagation();
    onNavigate(direction);
  };

  return (
    <>
      {/* Backdrop with blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Animated Image Container */}
      <motion.div
        ref={containerRef}
        initial={{
          left: originRect.left,
          top: originRect.top,
          width: originRect.width,
          height: originRect.height,
          borderRadius: 4,
        }}
        animate={{
          left: centerX + dragX,
          top: centerY,
          width: finalSize.width,
          height: finalSize.height,
          borderRadius: 8,
        }}
        exit={{
          left: targetExitRect.left,
          top: targetExitRect.top,
          width: targetExitRect.width,
          height: targetExitRect.height,
          borderRadius: 4,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="fixed z-50 overflow-hidden touch-pan-y"
        onClick={onClose}
        // Mobile drag/swipe handling
        drag={isMobile ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
      >
        {/* Image with crossfade on navigation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={photo.url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full relative"
          >
            <Image
              src={fullUrl}
              alt={photo.category}
              fill
              className="object-cover"
              placeholder="blur"
              blurDataURL={photo.blurDataUrl}
              sizes="90vw"
              priority
              unoptimized
              onLoad={handleLoad}
            />
          </motion.div>
        </AnimatePresence>

        {/* Desktop Navigation Zones - Inside the image (left/right 25%) */}
        {!isMobile && (
          <>
            {/* Left Navigation Zone - 25% of image width */}
            {hasPrev && (
              <div
                className="absolute left-0 top-0 h-full w-1/4 cursor-pointer flex items-center justify-start pl-4"
                onMouseEnter={() => setIsHoveringNav("left")}
                onMouseLeave={() => setIsHoveringNav(null)}
                onClick={(e) => handleNavClick(e, "prev")}
              >
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: isHoveringNav === "left" ? 1 : 0,
                    x: isHoveringNav === "left" ? 0 : -10,
                  }}
                  transition={{ duration: 0.2 }}
                  className="p-3 rounded-full bg-black/40 backdrop-blur-sm text-white"
                >
                  <ArrowIcon direction="left" />
                </motion.div>
              </div>
            )}

            {/* Right Navigation Zone - 25% of image width */}
            {hasNext && (
              <div
                className="absolute right-0 top-0 h-full w-1/4 cursor-pointer flex items-center justify-end pr-4"
                onMouseEnter={() => setIsHoveringNav("right")}
                onMouseLeave={() => setIsHoveringNav(null)}
                onClick={(e) => handleNavClick(e, "next")}
              >
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{
                    opacity: isHoveringNav === "right" ? 1 : 0,
                    x: isHoveringNav === "right" ? 0 : 10,
                  }}
                  transition={{ duration: 0.2 }}
                  className="p-3 rounded-full bg-black/40 backdrop-blur-sm text-white"
                >
                  <ArrowIcon direction="right" />
                </motion.div>
              </div>
            )}
          </>
        )}

        {/* Swipe indicator for mobile */}
        {isMobile && (hasPrev || hasNext) && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {hasPrev && (
              <div className="w-8 h-1 bg-white/40 rounded-full" />
            )}
            <div className="w-8 h-1 bg-white rounded-full" />
            {hasNext && (
              <div className="w-8 h-1 bg-white/40 rounded-full" />
            )}
          </div>
        )}
      </motion.div>

      {/* Close hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 text-white/50 text-sm pointer-events-none"
      >
        {isMobile ? "Swipe to navigate • Tap to close" : "Click anywhere or press ESC to close • ← → to navigate"}
      </motion.div>
    </>
  );
}
