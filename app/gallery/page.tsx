import { getAllImages } from "@/lib/gallery.server";
import GalleryView from "@/components/gallery/GalleryView";

export const metadata = {
  title: "Gallery | The Wedding",
  description: "Wedding photo gallery",
};

/**
 * Extract time value from category name for chronological sorting.
 * e.g., "Bridal Party 2PM" → 14, "Preparation 10AM" → 10
 */
function getCategoryTimeValue(category: string): number {
  const match = category.match(/(\d{1,2})(AM|PM)$/i);
  if (!match) return 0;

  let hour = parseInt(match[1], 10);
  const isPM = match[2].toUpperCase() === "PM";

  // Convert to 24-hour format
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;

  return hour;
}

export default async function GalleryPage() {
  const photos = await getAllImages();

  // Extract unique categories and sort by time (10AM → 7PM)
  const categories = Array.from(
    new Set(photos.map((p) => p.category))
  ).sort((a, b) => getCategoryTimeValue(a) - getCategoryTimeValue(b));

  // Sort photos chronologically by their category's time
  const sortedPhotos = [...photos].sort(
    (a, b) => getCategoryTimeValue(a.category) - getCategoryTimeValue(b.category)
  );

  return (
    <main className="min-h-screen bg-black">
      <GalleryView photos={sortedPhotos} categories={categories} />
    </main>
  );
}
