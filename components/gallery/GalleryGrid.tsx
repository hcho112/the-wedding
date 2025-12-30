"use client";

import { Fragment } from "react";
import type { PhotoManifest } from "@/types";
import GalleryItem from "./GalleryItem";

type CategoryBoundary = {
  category: string;
  index: number;
};

type GalleryGridProps = {
  photos: PhotoManifest[];
  onPhotoClick: (photo: PhotoManifest, rect: DOMRect) => void;
  categoryBoundaries?: CategoryBoundary[];
  onRegisterSentinel?: (category: string, element: HTMLDivElement | null) => void;
  onRegisterPhotoRef?: (photoUrl: string, element: HTMLDivElement | null) => void;
};

export default function GalleryGrid({
  photos,
  onPhotoClick,
  categoryBoundaries = [],
  onRegisterSentinel,
  onRegisterPhotoRef,
}: GalleryGridProps) {
  // Create a set of indices where category boundaries occur
  const boundaryIndices = new Set(categoryBoundaries.map((b) => b.index));
  const boundaryMap = new Map(categoryBoundaries.map((b) => [b.index, b.category]));

  return (
    <div
      className="
        mx-auto
        w-full sm:max-w-[720px] lg:max-w-[900px] xl:max-w-[1080px]
        grid grid-cols-3
        gap-[2px]
        bg-black
      "
    >
      {photos.map((photo, index) => (
        <Fragment key={photo.id}>
          {/* Category sentinel - invisible marker at category boundaries */}
          {boundaryIndices.has(index) && onRegisterSentinel && (
            <div
              ref={(el) => onRegisterSentinel(boundaryMap.get(index)!, el)}
              data-category={boundaryMap.get(index)}
              className="col-span-3 h-0 -mt-[2px]"
              aria-hidden="true"
            />
          )}
          <GalleryItem photo={photo} onClick={onPhotoClick} onRegisterRef={onRegisterPhotoRef} />
        </Fragment>
      ))}
    </div>
  );
}
