"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { PhotoManifest } from "@/types";
import { getResponsiveVariant, BREAKPOINTS } from "@/lib/gallery";
import { markImageLoaded, isImageLoaded } from "@/lib/image-cache";

type HeroImageProps = {
  photo: PhotoManifest | null;
  alt?: string;
  className?: string;
};

/**
 * Find a cached variant URL from the photo, checking all variants
 */
function findCachedVariant(photo: PhotoManifest): { url: string; width: number; height: number } | null {
  const variantKeys = ["mobile", "tablet", "desktop", "full"] as const;

  for (const key of variantKeys) {
    const variant = photo.variants[key];
    if (variant?.url && isImageLoaded(variant.url)) {
      return { url: variant.url, width: variant.width, height: variant.height };
    }
  }

  if (isImageLoaded(photo.url)) {
    return { url: photo.url, width: photo.width, height: photo.height };
  }

  return null;
}

export default function HeroImage({
  photo,
  alt = "Hero Image",
  className = "",
}: HeroImageProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number>(1920);
  const lockedVariantRef = useRef<{ url: string; width: number; height: number } | null>(null);

  useEffect(() => {
    setViewportWidth(window.innerWidth);
    setHasMounted(true);

    function handleResize() {
      setViewportWidth(window.innerWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!photo) {
    return null;
  }

  // Determine the variant to use
  let variant: { url: string; width: number; height: number };
  let isCached = false;

  if (lockedVariantRef.current) {
    variant = lockedVariantRef.current;
    // Check cache status for the locked variant
    isCached = isImageLoaded(variant.url);
  } else {
    const cachedVariant = findCachedVariant(photo);

    if (cachedVariant) {
      variant = cachedVariant;
      isCached = true;
      lockedVariantRef.current = variant;
    } else if (hasMounted) {
      variant = getResponsiveVariant(photo, viewportWidth);
      lockedVariantRef.current = variant;
    } else {
      // SSR/initial render: use full variant
      variant = { url: photo.variants.full?.url || photo.url, width: photo.width, height: photo.height };
    }
  }

  const handleLoad = () => {
    markImageLoaded(variant.url);
    lockedVariantRef.current = variant;
  };

  // SOLUTION: Use CSS background-image as INSTANT fallback
  //
  // Problem: Next.js Image takes time to initialize even for cached images.
  // During this time, showing nothing = black flash, showing blur = blur flash.
  //
  // Solution: CSS background-image uses browser's HTTP cache and renders INSTANTLY.
  // - For cached images: CSS shows the real image immediately
  // - For non-cached images: CSS shows blur immediately
  // - Next.js Image renders on top once it's ready (provides optimization benefits)
  //
  // This eliminates BOTH black flash AND unnecessary blur flash.

  const backgroundUrl = isCached ? variant.url : photo.blurDataUrl;

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
        sizes={`(max-width: ${BREAKPOINTS.mobile}px) 100vw, (max-width: ${BREAKPOINTS.tablet}px) 100vw, 100vw`}
        unoptimized
        onLoad={handleLoad}
      />
    </div>
  );
}
