import { getAllImages, getImageById } from "@/lib/gallery.server";
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
  params: Promise<{ categorySlug: string; photoId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, photoId } = await params;
  const photo = await getImageById(photoId);

  if (!photo) {
    return {
      title: "Photo Not Found | The Wedding",
    };
  }

  const photos = await getAllImages();
  const categories = Array.from(new Set(photos.map((p) => p.category)));
  const category = slugToCategory(categorySlug, categories);

  return {
    title: `${category || photo.category} | Gallery | The Wedding`,
    description: `Wedding photo from ${category || photo.category}`,
    openGraph: {
      images: [{ url: photo.variants.desktop?.url || photo.url }],
    },
  };
}

export default async function PhotoInCategoryPage({ params }: Props) {
  const { categorySlug, photoId } = await params;
  const photos = await getAllImages();

  // Verify photo exists
  const photo = photos.find((p) => p.id === photoId);
  if (!photo) {
    notFound();
  }

  // Extract unique categories and sort by time
  const categories = sortCategoriesByTime(
    Array.from(new Set(photos.map((p) => p.category)))
  );

  // Find category matching the slug
  const category = slugToCategory(categorySlug, categories);

  // If category slug doesn't match photo's actual category, redirect to correct URL
  const photoActualSlug = categoryToSlug(photo.category);
  if (!category || categorySlug !== photoActualSlug) {
    redirect(`/gallery/${photoActualSlug}/${photoId}`);
  }

  // Sort photos chronologically by their category's time
  const sortedPhotos = sortPhotosByTime(photos);

  return (
    <main className="min-h-screen bg-black">
      <GalleryView
        photos={sortedPhotos}
        categories={categories}
        initialCategory={category}
        initialPhotoId={photoId}
      />
    </main>
  );
}
