import type { PhotoManifest } from "@/types";

// Breakpoints matching the variant sizes
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1280,
  desktop: 1920,
} as const;

/**
 * Gets variant with URL and dimensions based on viewport width
 */
export function getResponsiveVariant(
  photo: PhotoManifest,
  width: number
): { url: string; width: number; height: number } {
  if (width <= BREAKPOINTS.mobile && photo.variants.mobile?.url) {
    return {
      url: photo.variants.mobile.url,
      width: photo.variants.mobile.width,
      height: photo.variants.mobile.height,
    };
  }
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
