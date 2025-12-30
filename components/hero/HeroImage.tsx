"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import type { PhotoManifest } from "@/types";
import { markImageLoaded, isImageLoaded } from "@/lib/image-cache";

// Breakpoint for mobile/desktop variant selection
const MOBILE_BREAKPOINT = 768;

type HeroImageProps = {
  photo: PhotoManifest | null;
  alt?: string;
  className?: string;
};

export default function HeroImage({
  photo,
  alt = "Hero Image",
  className = "",
}: HeroImageProps) {
  // Start with null to detect client-side viewport
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [showCached, setShowCached] = useState(false);

  // Detect viewport on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Select variant based on viewport:
  // - Mobile (<768px): tablet variant (~400KB) for faster LCP
  // - Desktop (>=768px): desktop variant (~1MB) for maximum quality
  const variant = useMemo(() => {
    if (!photo) return null;

    // Before hydration (SSR), use desktop as default
    // After hydration, use appropriate variant for viewport
    const useTablet = isMobile === true;

    const selectedVariant = useTablet
      ? photo.variants.tablet
      : photo.variants.desktop;

    if (selectedVariant?.url) {
      return {
        url: selectedVariant.url,
        width: selectedVariant.width,
        height: selectedVariant.height,
      };
    }

    // Fallback to original
    return { url: photo.url, width: photo.width, height: photo.height };
  }, [photo, isMobile]);

  // Check cache status after variant is determined
  useEffect(() => {
    if (variant && isImageLoaded(variant.url)) {
      setShowCached(true);
    } else {
      setShowCached(false);
    }
  }, [variant]);

  if (!photo || !variant) {
    return null;
  }

  const handleLoad = () => {
    markImageLoaded(variant.url);
    setShowCached(true);
  };

  // Use cached image as background if available (SPA navigation),
  // otherwise use blur placeholder (initial load / page refresh)
  const backgroundUrl = showCached ? variant.url : photo.blurDataUrl;

  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Image
        src={variant.url}
        alt={alt}
        fill
        className={className}
        priority
        placeholder="empty"
        sizes="100vw"
        unoptimized
        onLoad={handleLoad}
      />
    </div>
  );
}
