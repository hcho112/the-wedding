import sharp from "sharp";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import type { ImageMetadata } from "../types";

dotenv.config({ path: ".env.local" });

const args = process.argv.slice(2);
if (args.length < 1) {
    console.error("Usage: npx tsx scripts/optimize-images.ts <source-directory>");
    process.exit(1);
}

const sourceDirRaw = args[0];
const sourceDir = path.resolve(sourceDirRaw);

console.log(`Source: ${sourceDir}`);

// 1. Fixed Output Directory: "photos-optimized"
const outputDir = path.resolve(process.cwd(), "photos-optimized");
console.log(`Output: ${outputDir}`);

// Ensure source exists
if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory ${sourceDir} does not exist.`);
    process.exit(1);
}

// Clean/Ensure output directory logic
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Define target sizes
const SIZES = {
    mobile: 640,
    tablet: 1280,
    desktop: 1920,
    full: 3840,
} as const;

// Placeholder generator
async function generatePlaceholder(buffer: Buffer): Promise<string> {
    const placeholder = await sharp(buffer)
        .resize(32, null, { withoutEnlargement: true })
        .jpeg({ quality: 40 })
        .toBuffer();

    return `data:image/jpeg;base64,${placeholder.toString('base64')}`;
}

const metadataList: ImageMetadata[] = [];

// Helper to find all files recursively first
function getAllFiles(dir: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, fileList);
        } else {
            if (/\.(jpg|jpeg|png|webp|avif)$/i.test(file)) {
                fileList.push(fullPath);
            }
        }
    }
    return fileList;
}

// Processing function for a single file
async function processSingleFile(fullPath: string, baseDir: string) {
    try {
        const relativePath = path.relative(baseDir, path.dirname(fullPath));
        const outputSubDir = path.join(outputDir, relativePath);
        const fileName = path.basename(fullPath);
        const fileNameNoExt = path.parse(fileName).name;

        if (!fs.existsSync(outputSubDir)) {
            fs.mkdirSync(outputSubDir, { recursive: true });
        }

        console.log(`Processing: ${fileName}`);

        const inputBuffer = fs.readFileSync(fullPath);
        const blurDataUrl = await generatePlaceholder(inputBuffer);

        const variants: any = {};

        // Generate each size
        for (const [sizeName, width] of Object.entries(SIZES)) {
            const outFileName = `${fileNameNoExt}-${sizeName}.webp`;
            const outputPath = path.join(outputSubDir, outFileName);

            // ASPECT RATIO: By providing only `width`, Sharp automatically calculates height 
            // to maintain aspect ratio. This is exactly what we want.
            await sharp(inputBuffer)
                .resize({
                    width: width,
                    withoutEnlargement: true,
                })
                .webp({ quality: 100 })
                .toFile(outputPath);

            const meta = await sharp(outputPath).metadata();

            variants[sizeName] = {
                width: meta.width || 0,
                height: meta.height || 0,
                relativePath: path.join(relativePath, outFileName),
            };
        }

        metadataList.push({
            originalName: fileName,
            relativePathBase: relativePath,
            variants: variants,
            blurDataUrl,
        });

    } catch (err) {
        console.error(`Error processing ${path.basename(fullPath)}:`, err);
    }
}

async function main() {
    console.log("Scanning files...");
    const allFiles = getAllFiles(sourceDir);
    console.log(`Found ${allFiles.length} images.`);
    console.log("Starting parallel optimization (Concurrency: 5)...");

    // Simple concurrency control
    const CONCURRENCY = 5;
    for (let i = 0; i < allFiles.length; i += CONCURRENCY) {
        const chunk = allFiles.slice(i, i + CONCURRENCY);
        await Promise.all(chunk.map(file => processSingleFile(file, sourceDir)));
    }

    // 2. Metadata at Root: "photo-metadata.json"
    const metadataPath = path.resolve(process.cwd(), "photo-metadata.json");
    fs.writeFileSync(metadataPath, JSON.stringify(metadataList, null, 2));

    console.log("Optimization complete!");
    console.log(`Multi-res images saved to: ${outputDir}`);
    console.log(`Metadata saved to: ${metadataPath}`);
}

main();
