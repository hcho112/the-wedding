"use client";

import { motion } from "framer-motion";
import type { PersonContour } from "@/types";

type PersonOverlayProps = {
  member: PersonContour;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  isMobile: boolean;
};

export default function PersonOverlay({
  member,
  isHovered,
  onHover,
  onLeave,
  isMobile,
}: PersonOverlayProps) {
  // Handle mobile tap toggle
  const handleClick = () => {
    if (isMobile) {
      if (isHovered) {
        onLeave();
      } else {
        onHover();
      }
    }
  };

  return (
    <g>
      {/* Invisible hit area for hover/tap detection */}
      <rect
        x={member.hitArea.x}
        y={member.hitArea.y}
        width={member.hitArea.width}
        height={member.hitArea.height}
        fill="transparent"
        style={{ pointerEvents: "auto", cursor: "pointer" }}
        onMouseEnter={!isMobile ? onHover : undefined}
        onMouseLeave={!isMobile ? onLeave : undefined}
        onClick={handleClick}
      />

      {/* Animated contour path - only visible on hover */}
      <motion.path
        d={member.pathData}
        fill="none"
        stroke="white"
        strokeWidth="0.003"
        strokeDasharray="0.012 0.006"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          pathLength: isHovered ? 1 : 0,
        }}
        transition={{
          duration: 0.6,
          ease: "easeOut",
          pathLength: { duration: 0.8, ease: "easeInOut" },
        }}
        style={{
          filter: "drop-shadow(0 0 2px rgba(255,255,255,0.5))",
        }}
      />

      {/* Subtle glow effect on hover */}
      {isHovered && (
        <motion.path
          d={member.pathData}
          fill="none"
          stroke="white"
          strokeWidth="0.008"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            filter: "blur(4px)",
          }}
        />
      )}
    </g>
  );
}
