/**
 * SVG Path Normalizer
 *
 * This script helps convert pixel-based SVG paths to normalized (0-1) coordinates.
 *
 * Usage:
 *   npx tsx scripts/normalize-svg-path.ts <width> <height> "<path>"
 *
 * Example:
 *   npx tsx scripts/normalize-svg-path.ts 1920 1280 "M100,500 L200,600 C250,650 300,700 350,750"
 *
 * Output:
 *   M0.0521,0.3906 L0.1042,0.4688 C0.1302,0.5078 0.1563,0.5469 0.1823,0.5859
 */

function normalizePathData(pathData: string, width: number, height: number): string {
  // Match all coordinate pairs in the path
  // Handles: M, L, C, S, Q, T, A commands with their coordinates
  return pathData.replace(
    /([0-9]+\.?[0-9]*)\s*,\s*([0-9]+\.?[0-9]*)/g,
    (_, x, y) => {
      const nx = (parseFloat(x) / width).toFixed(4);
      const ny = (parseFloat(y) / height).toFixed(4);
      return `${nx},${ny}`;
    }
  );
}

function denormalizePathData(pathData: string, width: number, height: number): string {
  // Reverse: convert normalized coordinates back to pixels
  return pathData.replace(
    /([0-9]+\.?[0-9]*)\s*,\s*([0-9]+\.?[0-9]*)/g,
    (_, x, y) => {
      const px = Math.round(parseFloat(x) * width);
      const py = Math.round(parseFloat(y) * height);
      return `${px},${py}`;
    }
  );
}

function calculateBoundingBox(pathData: string): { x: number; y: number; width: number; height: number } {
  const coords: { x: number; y: number }[] = [];

  // Extract all coordinate pairs
  const matches = pathData.matchAll(/([0-9]+\.?[0-9]*)\s*,\s*([0-9]+\.?[0-9]*)/g);
  for (const match of matches) {
    coords.push({
      x: parseFloat(match[1]),
      y: parseFloat(match[2])
    });
  }

  if (coords.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...coords.map(c => c.x));
  const maxX = Math.max(...coords.map(c => c.x));
  const minY = Math.min(...coords.map(c => c.y));
  const maxY = Math.max(...coords.map(c => c.y));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log(`
SVG Path Normalizer for Bridal Party Contours

Usage:
  npx tsx scripts/normalize-svg-path.ts <width> <height> "<path>"

Examples:
  # Normalize pixel path to 0-1 range (for image 1920x1280):
  npx tsx scripts/normalize-svg-path.ts 1920 1280 "M100,500 L200,600"

  # Also shows bounding box for hit area calculation

Options:
  --denormalize   Convert 0-1 coordinates back to pixels
  `);
  process.exit(1);
}

const isDenormalize = args.includes('--denormalize');
const filteredArgs = args.filter(a => !a.startsWith('--'));

const width = parseFloat(filteredArgs[0]);
const height = parseFloat(filteredArgs[1]);
const pathData = filteredArgs[2];

if (isDenormalize) {
  console.log('\nDenormalized path (pixels):');
  console.log(denormalizePathData(pathData, width, height));
} else {
  console.log('\nNormalized path (0-1):');
  const normalized = normalizePathData(pathData, width, height);
  console.log(normalized);

  console.log('\nBounding box (normalized):');
  const bbox = calculateBoundingBox(normalized);
  console.log(JSON.stringify(bbox, null, 2));

  console.log('\nName tag anchor (center-top, normalized):');
  console.log(JSON.stringify({
    x: parseFloat((bbox.x + bbox.width / 2).toFixed(4)),
    y: parseFloat((bbox.y - 0.04).toFixed(4))
  }, null, 2));
}
