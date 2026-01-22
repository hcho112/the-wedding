import { getAllImages } from "@/lib/gallery.server";
import {
  slugToCategory,
  sortCategoriesByTime,
  sortPhotosByTime,
  categoryToSlug,
} from "@/lib/gallery-utils";
import GalleryView from "@/components/gallery/GalleryView";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ categorySlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const photos = await getAllImages();
  const categories = Array.from(new Set(photos.map((p) => p.category)));
  const category = slugToCategory(categorySlug, categories);

  if (!category) {
    return {
      title: "Category Not Found | The Wedding",
    };
  }

  return {
    title: `${category} | Gallery | The Wedding`,
    description: `Wedding photos from ${category}`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const photos = await getAllImages();

  // Extract unique categories and sort by time
  const categories = sortCategoriesByTime(
    Array.from(new Set(photos.map((p) => p.category)))
  );

  // Check if this slug is actually a photoId (backwards compatibility)
  const matchingPhoto = photos.find((p) => p.id === categorySlug);
  if (matchingPhoto) {
    // This is a photoId, not a category slug - redirect to proper URL
    const photoCategory = categoryToSlug(matchingPhoto.category);
    redirect(`/gallery/${photoCategory}/${categorySlug}`);
  }

  // Find category matching the slug
  const category = slugToCategory(categorySlug, categories);
  if (!category) {
    notFound();
  }

  // Sort photos chronologically by their category's time
  const sortedPhotos = sortPhotosByTime(photos);

  return (
    <main className="min-h-screen bg-black">
      <GalleryView
        photos={sortedPhotos}
        categories={categories}
        initialCategory={category}
      />
    </main>
  );
}
