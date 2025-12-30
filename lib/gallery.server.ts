import type { PhotoManifest } from "@/types";
import { promises as fs } from "fs";
import path from "path";

export type GetImagesOptions = {
  category?: string | null;
  id?: string | null;
};

/**
 * Reads the manifest from file system (server-only).
 */
async function readManifest(): Promise<PhotoManifest[]> {
  try {
    const manifestPath = path.join(process.cwd(), "public", "image-manifest.json");
    const data = await fs.readFile(manifestPath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Fetches images from the manifest with optional filtering.
 * Server-only: reads from file system.
 */
export async function getImages(
  options?: GetImagesOptions
): Promise<PhotoManifest[] | PhotoManifest | null> {
  const manifest = await readManifest();

  if (options?.id) {
    return manifest.find((photo) => photo.id === options.id) || null;
  }

  if (options?.category) {
    return manifest.filter((photo) => photo.category === options.category);
  }

  return manifest;
}

/**
 * Get single image by ID (server-only)
 */
export async function getImageById(id: string): Promise<PhotoManifest | null> {
  const result = await getImages({ id });
  return result as PhotoManifest | null;
}

/**
 * Get images by category (server-only)
 */
export async function getImagesByCategory(
  category: string
): Promise<PhotoManifest[]> {
  const result = await getImages({ category });
  return result as PhotoManifest[];
}

/**
 * Get all images (server-only)
 */
export async function getAllImages(): Promise<PhotoManifest[]> {
  const result = await getImages();
  return result as PhotoManifest[];
}
