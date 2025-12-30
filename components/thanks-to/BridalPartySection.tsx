"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { PhotoManifest, PersonContour } from "@/types";
import { BREAKPOINTS } from "@/lib/gallery";
import PersonOverlay from "./PersonOverlay";
import NameTag from "./NameTag";

type BridalPartySectionProps = {
  photo: PhotoManifest;
  members: PersonContour[];
};

export default function BridalPartySection({ photo, members }: BridalPartySectionProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get current hovered member
  const hoveredMember = hoveredId
    ? members.find((m) => m.id === hoveredId)
    : null;

  // Use desktop variant for high quality display
  const imageUrl = photo.variants.desktop?.url || photo.url;

  return (
    <section className="relative">
      {/* Photo Container */}
      <div
        className="relative w-full overflow-hidden rounded-lg"
        style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
      >
        {/* Base Photo */}
        <Image
          src={imageUrl}
          alt="Bridal Party"
          fill
          className="object-cover"
          placeholder="blur"
          blurDataURL={photo.blurDataUrl}
          sizes={`(max-width: ${BREAKPOINTS.mobile}px) 100vw, (max-width: ${BREAKPOINTS.tablet}px) 100vw, 1080px`}
          unoptimized
        />

        {/* SVG Overlay - viewBox 0-1 makes paths resolution-independent */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          style={{ pointerEvents: "none" }}
        >
          {members.map((member) => (
            <PersonOverlay
              key={member.id}
              member={member}
              isHovered={hoveredId === member.id}
              onHover={() => setHoveredId(member.id)}
              onLeave={() => setHoveredId(null)}
              isMobile={isMobile}
            />
          ))}
        </svg>

        {/* Name Tag - Rendered outside SVG for better styling */}
        <AnimatePresence>
          {hoveredMember && (
            <motion.div
              key={hoveredMember.id}
              className="absolute pointer-events-none z-20"
              style={{
                left: `${hoveredMember.nameTagAnchor.x * 100}%`,
                top: `${hoveredMember.nameTagAnchor.y * 100}%`,
                transform: "translate(-50%, -100%)",
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <NameTag name={hoveredMember.name} role={hoveredMember.role} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Tap Instructions */}
      {isMobile && (
        <p className="text-white/40 text-xs text-center mt-3">
          Tap on each person to see their name
        </p>
      )}
    </section>
  );
}
