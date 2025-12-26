# The Wedding & Portfolio

A premium, interactive web application built with **Next.js 15**, serving as both a wedding photo gallery and a professional engineering portfolio.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Stable)
- **Styling**: Tailwind CSS v4, Font (Inter & Cormorant Garamond)
- **Animations**: Framer Motion
- **Scroll**: Lenis (Smooth Momentum Scroll)
- **Storage**: UploadThing
- **Image Processing**: Sharp (Local optimization script)

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file with your UploadThing token:
   ```env
   UPLOADTHING_TOKEN=...
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

## Image Workflow

This project uses a custom script pipeline to ensure high-performance image delivery.

### 1. Organize Photos
Organize your raw high-res photos in a local folder structure. The folder names will be used as **Categories** and **Time Filters**.

**Example Structure:**
```
/my-raw-photos
  /Ceremony
    /Afternoon
      photo1.jpg
  /Reception
    /Evening
      photo2.jpg
```

### 2. Optimize Images
Run the optimization script.
- Resizes images to max 1920px width.
- Converts to WebP.
- **Generates Blur Placeholders**.
- Creates a `metadata.json` file in the output folder.

```bash
npx tsx scripts/optimize-images.ts ./path/to/my-raw-photos
```

### 3. Upload & Generate Manifest
Upload the optimized images to UploadThing. This script reads the pre-calculated `metadata.json` for validation and speed.

```bash
npx tsx scripts/upload-images.ts ./path/to/my-raw-photos-optimized
```

### 4. Deploy Manifest
Move the generated `image-manifest.json` to the `public/` folder so the application can read it.

```bash
mv image-manifest.json public/
```
