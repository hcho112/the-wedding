import type { PhotoManifest } from "@/types";

// Breakpoints matching the variant sizes
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1280,
  desktop: 1920,
} as const;

/**
 * Gets variant with URL and dimensions based on viewport width.
 * Note: Mobile devices use tablet variant for better image quality
 * (mobile variant was too small/blurry on high-DPI phone screens).
 */
export function getResponsiveVariant(
  photo: PhotoManifest,
  width: number
): { url: string; width: number; height: number } {
  // Mobile and tablet both use tablet variant for better quality on high-DPI screens
  if (width <= BREAKPOINTS.tablet && photo.variants.tablet?.url) {
    return {
      url: photo.variants.tablet.url,
      width: photo.variants.tablet.width,
      height: photo.variants.tablet.height,
    };
  }
  if (width <= BREAKPOINTS.desktop && photo.variants.desktop?.url) {
    return {
      url: photo.variants.desktop.url,
      width: photo.variants.desktop.width,
      height: photo.variants.desktop.height,
    };
  }
  if (photo.variants.full?.url) {
    return {
      url: photo.variants.full.url,
      width: photo.variants.full.width,
      height: photo.variants.full.height,
    };
  }
  return { url: photo.url, width: photo.width, height: photo.height };
}
