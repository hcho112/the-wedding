import type { PhotoManifest, BridalPartyData } from "@/types";
import { promises as fs } from "fs";
import path from "path";

/**
 * Reads the bridal party contours data from file system.
 */
export async function getBridalPartyData(): Promise<BridalPartyData | null> {
  try {
    const dataPath = path.join(process.cwd(), "data", "bridal-party-contours.json");
    const data = await fs.readFile(dataPath, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Gets the bridal party photo from the manifest.
 */
export async function getBridalPartyPhoto(photoId: string): Promise<PhotoManifest | null> {
  try {
    const manifestPath = path.join(process.cwd(), "public", "image-manifest.json");
    const data = await fs.readFile(manifestPath, "utf-8");
    const manifest: PhotoManifest[] = JSON.parse(data);
    return manifest.find((photo) => photo.id === photoId) || null;
  } catch {
    return null;
  }
}
