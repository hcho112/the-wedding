import Link from "next/link";
import {
  getBridalPartyData,
  getBridalPartyPhoto,
} from "@/lib/thanks-to.server";
import BridalPartySection from "@/components/thanks-to/BridalPartySection";

export default async function ThanksPage() {
  const bridalPartyData = await getBridalPartyData();
  const bridalPartyPhoto = bridalPartyData
    ? await getBridalPartyPhoto(bridalPartyData.photoId)
    : null;

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-sm px-4 py-6 sm:px-6">
        <div className="max-w-[1080px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl sm:text-3xl font-light tracking-[0.1em]">
              Thanks To
            </h1>
            <p className="text-white/70 text-sm sm:text-base font-light mt-1 tracking-wide">
              Our Bridal Party
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
      <div className="px-4 sm:px-6 py-8">
        <div className="max-w-[1080px] mx-auto space-y-12">
          {/* Intro Text */}
          <section className="text-center space-y-4">
            <p className="text-white/80 text-lg sm:text-xl font-light leading-relaxed max-w-2xl mx-auto">
              We are so grateful to our amazing bridal party who stood by our
              side and made our special day unforgettable.
            </p>
            <p className="text-white/50 text-sm font-light">
              Hover over each person to see their name
            </p>
          </section>

          {/* Interactive Bridal Party Photo */}
          {bridalPartyPhoto && bridalPartyData && (
            <BridalPartySection
              photo={bridalPartyPhoto}
              members={bridalPartyData.members}
            />
          )}

          {/* Additional Thanks */}
          <section className="text-center space-y-8 pt-8 border-t border-white/10">
            <h2 className="text-white text-xl sm:text-2xl font-light tracking-[0.1em]">
              Special Thanks
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto text-left">
              <div className="space-y-2">
                <h3 className="text-white/90 font-medium">Photographer</h3>
                <p className="text-white/60 text-sm">
                  Frank and Peggy Photography
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-white/90 font-medium">Venue</h3>
                <p className="text-white/60 text-sm">
                  Provenance - Matua Velly
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-white/90 font-medium">Florist</h3>
                <p className="text-white/60 text-sm">Leaf & Honey</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-white/90 font-medium">Catering</h3>
                <p className="text-white/60 text-sm">Hip group</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-white/90 font-medium">Celebrant</h3>
                <p className="text-white/60 text-sm">Flynny Weddings</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-white/90 font-medium">Cake</h3>
                <p className="text-white/60 text-sm">The Caker</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-white/90 font-medium">Make up</h3>
                <p className="text-white/60 text-sm">Ellie & Yujin</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
