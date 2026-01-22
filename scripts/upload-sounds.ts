/**
 * SOUND UPLOAD & MANIFEST GENERATOR SCRIPT
 *
 * What it does:
 * Scans a directory of audio files, uploads them to UploadThing, and generates a JSON manifest file
 * that maps the remote URLs to their metadata (title, category).
 *
 * Why we use it:
 * Similar to images, we need a persistent record of our audio tracks. UploadThing stores the files,
 * and this manifest allows the frontend to load the correct track for each gallery category.
 *
 * How it works:
 * 1. Takes an input directory argument.
 * 2. Infers category from folder structure OR filename prefix.
 * 3. Uploads to UploadThing in batches.
 * 4. Writes `sound-manifest.json` directly to public/ folder.
 *
 * Directory Structure Options:
 *
 * Option A: Nested folders (category as folder name)
 *   sounds/
 *     Preparation 10AM/
 *       morning-prep.mp3
 *     Ceremony 2PM/
 *       ceremony.mp3
 *
 * Option B: Flat with category prefix (category_title.mp3)
 *   sounds/
 *     preparation_morning-prep.mp3
 *     ceremony_wedding-march.mp3
 *
 * Usage:
 *   npx tsx scripts/upload-sounds.ts <path-to-sounds-dir> [--default <category>]
 *
 * Examples:
 *   npx tsx scripts/upload-sounds.ts ./sounds
 *   npx tsx scripts/upload-sounds.ts ./sounds --default "Ceremony 2PM"
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { UTApi } from "uploadthing/server";
import type { SoundManifest, SoundTrack } from "../types";

dotenv.config({ path: ".env.local" });

const TOKEN = process.env.UPLOADTHING_TOKEN;
const SUPPORTED_FORMATS = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm"];

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error(`
🎵 Sound Upload Script

Usage:
  npx tsx scripts/upload-sounds.ts <source-directory> [--default <category>]

Options:
  --default <category>  Specify the default track category

Examples:
  npx tsx scripts/upload-sounds.ts ./sounds
  npx tsx scripts/upload-sounds.ts ./sounds --default "Ceremony 2PM"
`);
  process.exit(1);
}

const inputDirRaw = args[0];
const inputDir = path.resolve(process.cwd(), inputDirRaw);

// Parse --default flag
let defaultCategory: string | null = null;
const defaultFlagIndex = args.indexOf("--default");
if (defaultFlagIndex !== -1 && args[defaultFlagIndex + 1]) {
  defaultCategory = args[defaultFlagIndex + 1];
}

// Output path - directly to public folder
const manifestPath = path.resolve(process.cwd(), "public", "sound-manifest.json");

if (!TOKEN) {
  console.error("❌ UPLOADTHING_TOKEN is missing in .env.local");
  process.exit(1);
}

if (!fs.existsSync(inputDir)) {
  console.error(`❌ Directory ${inputDir} not found.`);
  process.exit(1);
}

// Ensure public folder exists
const publicDir = path.resolve(process.cwd(), "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const utapi = new UTApi({ token: TOKEN });

/**
 * Convert filename or directory name to a readable title
 */
function toTitle(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\.(mp3|wav|ogg|m4a|aac|webm)$/i, "")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Generate a URL-safe ID from category and filename
 */
function generateId(category: string, filename: string): string {
  const base = `${category}-${filename}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `track-${Date.now()}`;
}

/**
 * Check if a file is a supported audio format
 */
function isAudioFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_FORMATS.includes(ext);
}

interface AudioFileInfo {
  fullPath: string;
  filename: string;
  category: string;
  title: string;
}

/**
 * Scan directory for audio files
 */
function scanDirectory(dir: string): AudioFileInfo[] {
  const files: AudioFileInfo[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Nested structure: directory name is the category
      const category = entry.name;
      const categoryFiles = fs.readdirSync(fullPath);

      for (const file of categoryFiles) {
        const filePath = path.join(fullPath, file);
        if (isAudioFile(file) && fs.statSync(filePath).isFile()) {
          files.push({
            fullPath: filePath,
            filename: file,
            category: category,
            title: toTitle(path.parse(file).name),
          });
        }
      }
    } else if (isAudioFile(entry.name)) {
      // Flat structure: try to parse category from filename
      const filename = entry.name;
      const nameWithoutExt = path.parse(filename).name;

      let category = "Default";
      let title = toTitle(nameWithoutExt);

      // Try to split by underscore (category_title.mp3)
      if (nameWithoutExt.includes("_")) {
        const parts = nameWithoutExt.split("_");
        category = toTitle(parts[0]);
        title = toTitle(parts.slice(1).join(" "));
      }

      files.push({
        fullPath,
        filename,
        category,
        title,
      });
    }
  }

  return files;
}

async function main() {
  console.log(`
🎵 Sound Upload Script
━━━━━━━━━━━━━━━━━━━━━━
Source: ${inputDir}
Output: ${manifestPath}
`);

  // Scan for audio files
  console.log("Scanning for audio files...\n");
  const audioFiles = scanDirectory(inputDir);

  if (audioFiles.length === 0) {
    console.error(`❌ No audio files found in ${inputDir}`);
    console.error(`   Supported formats: ${SUPPORTED_FORMATS.join(", ")}`);
    process.exit(1);
  }

  console.log(`Found ${audioFiles.length} audio file(s):\n`);
  audioFiles.forEach((f) => {
    console.log(`  • ${f.category}/${f.filename} → "${f.title}"`);
  });

  // Prepare upload queue
  const uploadQueue: {
    file: File;
    info: AudioFileInfo;
  }[] = [];

  for (const info of audioFiles) {
    const fileBuffer = fs.readFileSync(info.fullPath);
    uploadQueue.push({
      file: new File([fileBuffer], info.filename, { type: getMimeType(info.filename) }),
      info,
    });
  }

  // Upload results storage
  const uploadedTracks: SoundTrack[] = [];

  // Upload in batches
  const BATCH_SIZE = 3; // Smaller batch for larger audio files
  console.log(`\nUploading ${uploadQueue.length} file(s) in batches of ${BATCH_SIZE}...\n`);

  for (let i = 0; i < uploadQueue.length; i += BATCH_SIZE) {
    const batch = uploadQueue.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(uploadQueue.length / BATCH_SIZE);

    console.log(`Batch ${batchNum}/${totalBatches}:`);

    try {
      const responses = await utapi.uploadFiles(batch.map((b) => b.file));

      responses.forEach((res, idx) => {
        const job = batch[idx];
        if (res.data) {
          console.log(`  ✓ ${job.info.filename} → ${res.data.url}`);

          uploadedTracks.push({
            id: res.data.key,
            title: job.info.title,
            category: job.info.category,
            filename: job.info.filename,
            url: res.data.url,
          });
        } else {
          console.error(`  ✗ Failed: ${job.info.filename}`, res.error);
        }
      });
    } catch (e) {
      console.error(`  ✗ Batch upload failed:`, e);
    }

    console.log("");
  }

  if (uploadedTracks.length === 0) {
    console.error("❌ No files were uploaded successfully.");
    process.exit(1);
  }

  // Determine default track
  let defaultTrackId = uploadedTracks[0].id;
  if (defaultCategory) {
    const defaultTrack = uploadedTracks.find(
      (t) => t.category.toLowerCase() === defaultCategory!.toLowerCase()
    );
    if (defaultTrack) {
      defaultTrackId = defaultTrack.id;
      console.log(`Default track: "${defaultTrack.title}" (${defaultCategory})`);
    } else {
      console.warn(`⚠️  Default category "${defaultCategory}" not found, using first track`);
    }
  }

  // Build manifest
  const manifest: SoundManifest = {
    defaultTrack: defaultTrackId,
    tracks: uploadedTracks,
  };

  // Write manifest to public folder
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━
✅ Upload complete!

Manifest: ${manifestPath}
Tracks:   ${uploadedTracks.length}
Default:  ${manifest.defaultTrack}

Categories:`);

  // Summary by category
  const byCategory = uploadedTracks.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`  • ${cat}: ${count} track(s)`);
  }

  console.log(`
The manifest is ready at public/sound-manifest.json
Your app will automatically use these tracks.
`);
}

/**
 * Get MIME type for audio file
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
    ".aac": "audio/aac",
    ".webm": "audio/webm",
  };
  return mimeTypes[ext] || "audio/mpeg";
}

main();
