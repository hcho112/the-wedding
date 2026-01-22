import {
  getBridalPartyData,
  getBridalPartyPhoto,
} from "@/lib/thanks-to.server";
import BridalPartySection from "@/components/thanks-to/BridalPartySection";
import ThanksPageClient from "@/components/thanks-to/ThanksPageClient";

export default async function ThanksPage() {
  const bridalPartyData = await getBridalPartyData();
  const bridalPartyPhoto = bridalPartyData
    ? await getBridalPartyPhoto(bridalPartyData.photoId)
    : null;

  return (
    <ThanksPageClient>
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
    </ThanksPageClient>
  );
}
