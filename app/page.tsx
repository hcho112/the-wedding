import HeroImage from "@/components/hero/HeroImage";
import { getImageById } from "@/lib/gallery.server";
import Link from "next/link";

// Landing page hero image ID from manifest
const HERO_IMAGE_ID = "iZFFzGDNq7lhEUMnuonYNeq8LoEZjrwbPcS3ndWOivgJaGs2";

// Navigation items
const NAV_ITEMS = [
  { label: "Gallery", href: "/gallery" },
  { label: "Thanks to", href: "/thanks" },
  { label: "Info", href: "/info" },
];

export default async function Home() {
  // Server-side: fetch hero image data (no flash, blur placeholder works immediately)
  const heroImage = await getImageById(HERO_IMAGE_ID);

  // Calculate aspect ratio for container (fallback to 3:2 if no image)
  const aspectRatio = heroImage
    ? `${heroImage.width} / ${heroImage.height}`
    : "3 / 2";

  return (
    <main className="h-screen w-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Container maintains image aspect ratio - all content positioned relative to actual image bounds */}
      <div
        className="relative max-h-full max-w-full h-full"
        style={{ aspectRatio }}
      >
        {/* Hero Image - Fills the aspect-ratio container */}
        <HeroImage
          photo={heroImage}
          alt="Wedding"
          className="object-cover w-full h-full"
        />

        {/* Floating Title - Centered within image bounds */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <div className="text-center text-white space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-thin tracking-[0.2em] uppercase">
              Jacqui & Danny
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl font-light tracking-[0.3em] uppercase">
              The Wedding
            </p>
          </div>
        </div>

        {/* Navigation - Bottom right of image bounds */}
        <nav className="absolute bottom-8 right-8 md:bottom-12 md:right-12 z-20">
          <ul className="flex flex-col items-end space-y-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-white text-sm md:text-base font-light tracking-[0.15em] uppercase hover:opacity-70 transition-opacity duration-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
