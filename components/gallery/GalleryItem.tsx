"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { PhotoManifest } from "@/types";
import { getPlaceholderProps, markImageLoaded } from "@/lib/image-cache";

type GalleryItemProps = {
  photo: PhotoManifest;
  onClick: (photo: PhotoManifest, rect: DOMRect) => void;
  onRegisterRef?: (photoUrl: string, element: HTMLDivElement | null) => void;
};

export default function GalleryItem({ photo, onClick, onRegisterRef }: GalleryItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Register ref with parent for exit animation targeting
  useEffect(() => {
    if (onRegisterRef) {
      onRegisterRef(photo.url, containerRef.current);
      return () => onRegisterRef(photo.url, null);
    }
  }, [photo.url, onRegisterRef]);

  // Use mobile variant for grid thumbnails (smallest, fastest)
  const thumbnailUrl = photo.variants.mobile?.url || photo.url;

  // Get placeholder props - skip blur if already loaded
  const placeholderProps = getPlaceholderProps(thumbnailUrl, photo.blurDataUrl);

  const handleClick = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      onClick(photo, rect);
    }
  };

  const handleLoad = () => {
    markImageLoaded(thumbnailUrl);
  };

  return (
    <motion.div
      ref={containerRef}
      onClick={handleClick}
      className="relative aspect-square cursor-pointer overflow-hidden rounded-[4px] bg-neutral-900"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Image
        src={thumbnailUrl}
        alt={photo.category}
        fill
        className="object-cover"
        {...placeholderProps}
        sizes="(max-width: 640px) 33vw, 300px"
        unoptimized
        onLoad={handleLoad}
      />
    </motion.div>
  );
}
