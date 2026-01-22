/**
 * Gallery URL utilities for category-based routing
 */

/**
 * Convert category name to URL-safe slug
 * e.g., "Preparation 10AM" → "preparation"
 * e.g., "Bridal Party 2PM" → "bridal-party"
 */
export function categoryToSlug(category: string): string {
  // Extract base name before time (e.g., "Preparation 10AM" → "Preparation")
  const baseName = category.replace(/\s+\d{1,2}(AM|PM)$/i, "").trim();
  return baseName.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Find category that matches a given slug
 */
export function slugToCategory(
  slug: string,
  categories: string[]
): string | null {
  return categories.find((cat) => categoryToSlug(cat) === slug) || null;
}

/**
 * Build URL path for a photo, optionally within a category context
 */
export function buildPhotoUrl(photoId: string, categorySlug?: string): string {
  if (categorySlug) {
    return `/gallery/${categorySlug}/${photoId}`;
  }
  return `/gallery/${photoId}`;
}

/**
 * Build URL path for a category
 */
export function buildCategoryUrl(categorySlug?: string): string {
  if (categorySlug) {
    return `/gallery/${categorySlug}`;
  }
  return "/gallery";
}

/**
 * Extract time value from category name for chronological sorting
 * e.g., "Bridal Party 2PM" → 14, "Preparation 10AM" → 10
 */
export function getCategoryTimeValue(category: string): number {
  const match = category.match(/(\d{1,2})(AM|PM)$/i);
  if (!match) return 0;

  let hour = parseInt(match[1], 10);
  const isPM = match[2].toUpperCase() === "PM";

  // Convert to 24-hour format
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;

  return hour;
}

/**
 * Sort categories chronologically by time
 */
export function sortCategoriesByTime(categories: string[]): string[] {
  return [...categories].sort(
    (a, b) => getCategoryTimeValue(a) - getCategoryTimeValue(b)
  );
}

/**
 * Sort photos chronologically by their category's time
 */
export function sortPhotosByTime<T extends { category: string }>(
  photos: T[]
): T[] {
  return [...photos].sort(
    (a, b) => getCategoryTimeValue(a.category) - getCategoryTimeValue(b.category)
  );
}
