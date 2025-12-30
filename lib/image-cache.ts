/**
 * Module-level cache for tracking loaded images.
 * Persists across SPA navigation but resets on full page reload.
 * This allows skipping blur placeholders for already-loaded images.
 */

const loadedImages = new Set<string>();

/**
 * Check if an image URL has been loaded before
 */
export function isImageLoaded(url: string): boolean {
  return loadedImages.has(url);
}

/**
 * Mark an image URL as loaded
 */
export function markImageLoaded(url: string): void {
  loadedImages.add(url);
}

/**
 * Get placeholder props based on whether image is already loaded
 */
export function getPlaceholderProps(
  url: string,
  blurDataUrl?: string
): { placeholder: "blur" | "empty"; blurDataURL?: string } {
  if (isImageLoaded(url)) {
    return { placeholder: "empty" };
  }
  return {
    placeholder: "blur",
    blurDataURL: blurDataUrl,
  };
}
