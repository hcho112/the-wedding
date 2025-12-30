/**
 * IMAGE UPLOAD & MANIFEST GENERATOR SCRIPT
 * 
 * What it does:
 * Scans a directory of (optimized) images, uploads them to UploadThing, and generates a JSON manifest file
 * that maps the remote URLs to their local metadata (Category, TimeOfDay, Dimensions).
 * 
 * Why we use it:
 * We need a persistent record of our gallery images. UploadThing stores the files, but we need to know 
 * WHICH files belong to WHICH category without querying the DB or parsing filenames at runtime. 
 * This manifest allows the frontend to lazy-load the entire gallery instantly.
 * 
 * How it works:
 * 1. Takes an input directory argument.
 * 2. Infers Category and TimeOfDay from the folder structure (e.g., /Ceremony/Afternoon/photo.webp).
 * 3. Uses `sharp` to read dimensions locally (faster/cheaper than checking remote).
 * 4. Uploads to UploadThing in batches.
 * 5. Writes `image-manifest.json` to the current working directory.
 * 
 * Usage:
 * npx tsx scripts/upload-images.ts <path-to-optimized-dir>
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { UTApi } from "uploadthing/server";
import type { ImageMetadata, PhotoManifest } from "../types";

dotenv.config({ path: ".env.local" });

const TOKEN = process.env.UPLOADTHING_TOKEN;

const args = process.argv.slice(2);
// Optional arg: input directory. Default to "photos-optimized"
const inputDirRaw = args.length > 0 ? args[0] : "photos-optimized";
const inputDir = path.resolve(process.cwd(), inputDirRaw);

const manifestPath = path.resolve(process.cwd(), "image-manifest.json");
// Metadata is now expected at root, named "photo-metadata.json"
const metadataPath = path.resolve(process.cwd(), "photo-metadata.json");

if (!TOKEN) {
    console.error("UPLOADTHING_TOKEN is missing in .env.local");
    process.exit(1);
}

if (!fs.existsSync(inputDir)) {
    console.error(`Directory ${inputDir} not found.`);
    process.exit(1);
}

if (!fs.existsSync(metadataPath)) {
    console.error(`Metadata file not found at ${metadataPath}. Did you run optimize-images.ts?`);
    process.exit(1);
}

const utapi = new UTApi({ token: TOKEN });

async function main() {
    console.log(`Starting upload process from: ${inputDir}`);

    const metadataList: ImageMetadata[] = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    const manifest: PhotoManifest[] = [];

    console.log(`Found ${metadataList.length} unique images (with multiple variants each).`);

    // Flatten all files to be uploaded
    // Map<VariantFilePath, { metaIndex: number, sizeName: string }>
    const uploadQueue: {
        path: string;
        file: File;
        metaIndex: number;
        sizeName: string;
    }[] = [];

    metadataList.forEach((meta, idx) => {
        Object.entries(meta.variants).forEach(([sizeName, variant]) => {
            const fullPath = path.join(inputDir, variant.relativePath!);
            if (fs.existsSync(fullPath)) {
                const fileBuffer = fs.readFileSync(fullPath);
                uploadQueue.push({
                    path: fullPath,
                    file: new File([fileBuffer], path.basename(fullPath)),
                    metaIndex: idx,
                    sizeName: sizeName
                });
            }
        });
    });

    console.log(`Total files to upload (all variants): ${uploadQueue.length}`);

    // Local cache of uploaded URLs by [metaIndex][sizeName]
    const uploadedUrls: Record<number, Record<string, { url: string, key: string }>> = {};

    // Upload in batches
    const BATCH_SIZE = 5;
    for (let i = 0; i < uploadQueue.length; i += BATCH_SIZE) {
        const batch = uploadQueue.slice(i, i + BATCH_SIZE);

        try {
            console.log(`Uploading batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} files)...`);

            const responses = await utapi.uploadFiles(batch.map(b => b.file));

            responses.forEach((res, idx) => {
                const job = batch[idx];
                if (res.data) {
                    console.log(`Uploaded ${job.sizeName}: ${res.data.url}`);

                    if (!uploadedUrls[job.metaIndex]) {
                        uploadedUrls[job.metaIndex] = {};
                    }
                    uploadedUrls[job.metaIndex][job.sizeName] = {
                        url: res.data.url,
                        key: res.data.key
                    };
                } else {
                    console.error(`Failed to upload ${job.path}`, res.error);
                }
            });

        } catch (e) {
            console.error("Batch upload failed", e);
        }
    }

    // Construct Manifest
    metadataList.forEach((meta, idx) => {
        const uploadedVariants = uploadedUrls[idx];
        if (!uploadedVariants) return; // Skip if nothing uploaded

        // Determine metadata from folder structure
        const parts = meta.relativePathBase.split(path.sep);

        let category = "Uncategorized";
        let timeOfDay = "Day";

        if (parts.length >= 1) category = parts[0];
        if (parts.length >= 2) timeOfDay = parts[1];

        const manifestVariants: any = {};

        // keys of variants are mobile, tablet, desktop, full
        Object.keys(meta.variants).forEach(size => {
            if (uploadedVariants[size]) {
                manifestVariants[size] = {
                    url: uploadedVariants[size].url,
                    width: meta.variants[size as keyof typeof meta.variants].width,
                    height: meta.variants[size as keyof typeof meta.variants].height
                };
            }
        });

        // Pick a default "main" URL (prefer Desktop, fall back to whatever exists)
        const defaultVariantKey =
            uploadedVariants['desktop'] ? 'desktop' :
                uploadedVariants['tablet'] ? 'tablet' :
                    Object.keys(uploadedVariants)[0];

        if (defaultVariantKey) {
            manifest.push({
                id: uploadedVariants[defaultVariantKey].key,
                category,
                timeOfDay,
                blurDataUrl: meta.blurDataUrl,
                variants: manifestVariants,
                url: uploadedVariants[defaultVariantKey].url,
                width: meta.variants[defaultVariantKey as keyof typeof meta.variants].width,
                height: meta.variants[defaultVariantKey as keyof typeof meta.variants].height,
            });
        }
    });

    // Write manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`Manifest written to: ${manifestPath}`);
}

main();
