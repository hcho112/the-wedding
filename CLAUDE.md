# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

### Image Pipeline Scripts

```bash
# 1. Optimize images (creates photos-optimized/ folder + photo-metadata.json in project root)
npx tsx scripts/optimize-images.ts /path/to/raw-photos

# 2. Upload to UploadThing (reads photo-metadata.json, outputs image-manifest.json)
npx tsx scripts/upload-images.ts

# 3. Deploy manifest
mv image-manifest.json public/
```

## Architecture

**Next.js 15 App Router** wedding photo gallery with UploadThing storage.

**Design Philosophy**: Minimalist "Interactive Gallery" — content-first UI with smooth Lenis scrolling, no unnecessary complexity.

### Image System (Static Manifest Approach)
- No runtime database queries — pre-generated JSON manifest
- Photos organized by **Category** (Ceremony, Reception, Portraits) and **TimeOfDay** (folder structure: `Source/Category/TimeOfDay/photo.jpg`)
- `scripts/optimize-images.ts` → generates responsive variants (mobile/tablet/desktop/full) + blur placeholders → outputs `photo-metadata.json`
- `scripts/upload-images.ts` → uploads to UploadThing → generates `image-manifest.json`
- `GalleryGrid` fetches `public/image-manifest.json` at runtime, uses custom Next.js Image loader for responsive variant selection

### Key Types (`types/index.ts`)
- `PhotoManifest`: Runtime image data with variants, blur placeholder, category/timeOfDay metadata
- `ImageVariant`: Width/height/url for each responsive breakpoint

### Styling
- Tailwind CSS v4 with CSS custom properties in `globals.css`
- Warm/neutral palette with dark mode support via `prefers-color-scheme`
- Fonts: Inter (sans), Cormorant Garamond (serif), Aileron (local in `app/fonts/`)

### Providers
- `SmoothScroll`: Lenis-based smooth scrolling wrapper (client component)

### Favicon
- `app/icon.svg` is the source of truth — Next.js auto-generates favicon from this SVG
- Design: Minimalist 8-petal flower with native SVG transparency

## Project Status
- **Complete**: Image pipeline, Gallery Grid with multi-resolution support
- **Pending**: About/Portfolio section, Hero section final polish
