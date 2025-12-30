"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { PhotoManifest } from "@/types";
import { markImageLoaded, isImageLoaded } from "@/lib/image-cache";

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
  // Start with blur to match server render (avoids hydration mismatch)
  const [showCached, setShowCached] = useState(false);

  // Hero image always uses desktop variant for maximum quality
  const desktopVariant = photo?.variants.desktop;
  const variant = desktopVariant?.url
    ? { url: desktopVariant.url, width: desktopVariant.width, height: desktopVariant.height }
    : photo
      ? { url: photo.url, width: photo.width, height: photo.height }
      : null;

  // After hydration, check if image is cached (for SPA navigation)
  useEffect(() => {
    if (variant && isImageLoaded(variant.url)) {
      setShowCached(true);
    }
  }, [variant]);

  if (!photo || !variant) {
    return null;
  }

  const handleLoad = () => {
    markImageLoaded(variant.url);
    setShowCached(true);
  };

  // Use cached high-res as background if available (SPA navigation),
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
