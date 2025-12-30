import Link from "next/link";
import Image from "next/image";
import { getImageById } from "@/lib/gallery.server";

// Background image ID from manifest
const BACKGROUND_IMAGE_ID = "iZFFzGDNq7lh4kPMssKgHUIJBjs1bpoaGMEcLS3rx2kit5QX";

export default async function InfoPage() {
  const backgroundImage = await getImageById(BACKGROUND_IMAGE_ID);

  return (
    <main className="min-h-screen bg-black relative">
      {/* Background Image with Dark Overlay */}
      {backgroundImage && (
        <div className="fixed inset-0 z-0">
          <Image
            src={backgroundImage.variants.desktop?.url || backgroundImage.url}
            alt=""
            fill
            className="object-cover"
            placeholder="blur"
            blurDataURL={backgroundImage.blurDataUrl}
            sizes="100vw"
            priority
            unoptimized
          />
          {/* Dark overlay for text visibility */}
          <div className="absolute inset-0 bg-black/70" />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/50 backdrop-blur-md px-4 py-6 sm:px-6">
        <div className="max-w-[1080px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl sm:text-3xl font-light tracking-[0.1em]">
              Info
            </h1>
            <p className="text-white/70 text-sm sm:text-base font-light mt-1 tracking-wide">
              About This Site
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-white/70 hover:text-white text-base sm:text-lg font-light tracking-wide transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sm:w-6 sm:h-6"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-[720px] mx-auto space-y-16">
          {/* About Section */}
          <section className="text-center space-y-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/60"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2 className="text-white text-xl sm:text-2xl font-light tracking-[0.1em]">
              Our Story
            </h2>
            <p className="text-white/70 text-base sm:text-lg font-light leading-relaxed">
              This site was created to preserve the cherished memories of our
              wedding day and to celebrate the wonderful people who shared in
              our joy. Thank you for being part of our story.
            </p>
          </section>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Built With Section */}
          <section className="text-center space-y-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/60"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h2 className="text-white text-xl sm:text-2xl font-light tracking-[0.1em]">
              Built With
            </h2>
            <p className="text-white/70 text-base sm:text-lg font-light leading-relaxed">
              This website was crafted with love using modern web technologies.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {[
                { name: "Next.js", href: "https://nextjs.org" },
                { name: "Vercel", href: "https://vercel.com" },
                { name: "Claude Code", href: "https://claude.ai" },
                { name: "Uploadthing", href: "https://uploadthing.com" },
              ].map((tech) => (
                <a
                  key={tech.name}
                  href={tech.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-white/5 text-white/60 text-sm font-light tracking-wide hover:bg-white/10 hover:text-white/80 transition-colors"
                >
                  {tech.name}
                </a>
              ))}
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Usage Notice Section */}
          <section className="text-center space-y-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/60"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <h2 className="text-white text-xl sm:text-2xl font-light tracking-[0.1em]">
              Image Usage
            </h2>
            <p className="text-white/70 text-base sm:text-lg font-light leading-relaxed">
              All photographs displayed on this site are for personal viewing
              only. Please do not download, reproduce, or use these images for
              any other purpose without explicit permission.
            </p>
          </section>

          {/* Footer */}
          <footer className="pt-8 border-t border-white/10 text-center">
            <p className="text-white/40 text-sm font-light">
              Made with love, 2024
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
