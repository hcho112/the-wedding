import { getAllImages } from "@/lib/gallery.server";
import { sortCategoriesByTime, sortPhotosByTime } from "@/lib/gallery-utils";
import GalleryView from "@/components/gallery/GalleryView";

export const metadata = {
  title: "Gallery | The Wedding",
  description: "Wedding photo gallery",
};

export default async function GalleryPage() {
  const photos = await getAllImages();

  // Extract unique categories and sort by time (10AM → 7PM)
  const categories = sortCategoriesByTime(
    Array.from(new Set(photos.map((p) => p.category)))
  );

  // Sort photos chronologically by their category's time
  const sortedPhotos = sortPhotosByTime(photos);

  return (
    <main className="min-h-screen bg-black">
      <GalleryView photos={sortedPhotos} categories={categories} />
    </main>
  );
}
