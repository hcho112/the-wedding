# The Wedding

A beautiful, interactive wedding photo gallery built to preserve and share cherished memories.

**Live Site:** [jacquianddanny.com](https://jacquianddanny.com)

## Overview

This web application serves as a personal wedding photo gallery featuring:

- **Landing Page** — Elegant hero image with couple's names and navigation
- **Photo Gallery** — Categorized photo grid with lightbox viewing, organized by ceremony moments
- **Thanks To** — Interactive bridal party photo with hover-to-reveal contours and name tags
- **Info** — About page with background image and site credits

## Features

- Responsive image variants (mobile, tablet, desktop, full) for optimal performance
- Blur placeholders for smooth image loading
- Smooth scroll with momentum (Lenis)
- Interactive SVG contour overlays with normalized coordinates (works across all screen sizes)
- Dark, minimal aesthetic with elegant typography

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Smooth Scroll | Lenis |
| Image Storage | Uploadthing |
| Image Processing | Sharp |
| Deployment | Vercel |
| AI Assistant | Claude Code |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Uploadthing account (for image storage)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd the-wedding
   npm install
   ```

2. **Set up environment variables**

   Create a `.env.local` file:
   ```env
   UPLOADTHING_TOKEN=your_uploadthing_token
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000)

## Image Workflow

This project uses a custom pipeline for optimized image delivery.

### Step 1: Organize Photos

Structure your raw photos in folders. Folder names become categories:

```
raw-photos/
├── Ceremony/
│   └── Afternoon/
│       └── photo1.jpg
├── Reception/
│   └── Evening/
│       └── photo2.jpg
└── Bridal Party/
    └── 2PM/
        └── group.jpg
```

### Step 2: Optimize Images

Run the optimization script to resize, convert to WebP, and generate blur placeholders:

```bash
npx tsx scripts/optimize-images.ts ./raw-photos
```

Output: `./raw-photos-optimized/` with `photo-metadata.json`

### Step 3: Upload to Uploadthing

Upload optimized images and generate the manifest:

```bash
npx tsx scripts/upload-images.ts ./raw-photos-optimized
```

Output: `image-manifest.json` in project root

### Step 4: Deploy Manifest

Move the manifest to the public folder:

```bash
mv image-manifest.json public/
```

## Project Structure

```
the-wedding/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── gallery/           # Photo gallery
│   ├── thanks/            # Bridal party page
│   └── info/              # About page
├── components/            # React components
│   ├── gallery/           # Gallery-related components
│   ├── hero/              # Hero image component
│   └── thanks-to/         # Interactive bridal party
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
├── scripts/               # Image processing scripts
├── data/                  # Static data (contours JSON)
└── public/                # Static assets & manifest
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Development Scripts

| Script | Description |
|--------|-------------|
| `scripts/optimize-images.ts` | Resize & optimize photos |
| `scripts/upload-images.ts` | Upload to Uploadthing |
| `scripts/extract-contours.py` | Generate SVG contours for bridal party |
| `scripts/normalize-svg-path.ts` | Convert pixel paths to normalized coordinates |

## License

This project is licensed under the **MIT License** — see below for details.

**Note:** All photographs displayed on this site are personal and are **not** covered by the MIT license. Photos may not be downloaded, reproduced, or used without explicit permission.

```
MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

Built with Next.js, Vercel, Claude Code, and Uploadthing
