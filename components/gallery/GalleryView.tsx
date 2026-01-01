"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { PhotoManifest } from "@/types";
import GalleryGrid from "./GalleryGrid";
import Lightbox from "./Lightbox";

type GalleryViewProps = {
  photos: PhotoManifest[];
  categories: string[];
};

type SelectedState = {
  photo: PhotoManifest;
  originRect: DOMRect;
  openedAt: number; // Timestamp to force re-mount on each click
  index: number; // Index in filteredPhotos for navigation
  openedViaClick: boolean; // Track if opened via user click (vs deep link/popstate)
} | null;

type CategoryBoundary = {
  category: string;
  index: number;
};

const BATCH_SIZE = 30;

export default function GalleryView({ photos, categories }: GalleryViewProps) {
  const [selected, setSelected] = useState<SelectedState>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visibleCategory, setVisibleCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [exitRect, setExitRect] = useState<DOMRect | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const categoryObserverRef = useRef<IntersectionObserver | null>(null);
  const sentinelElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const photoRefsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Filter photos by category
  const filteredPhotos = selectedCategory
    ? photos.filter((p) => p.category === selectedCategory)
    : photos;

  // Visible photos for infinite scroll
  const visiblePhotos = filteredPhotos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPhotos.length;

  // Compute category boundaries (where each category starts in the array)
  const categoryBoundaries = useMemo((): CategoryBoundary[] => {
    if (selectedCategory) return []; // No boundaries needed when filtered

    const boundaries: CategoryBoundary[] = [];
    let currentCategory = "";

    visiblePhotos.forEach((photo, index) => {
      if (photo.category !== currentCategory) {
        currentCategory = photo.category;
        boundaries.push({ category: currentCategory, index });
      }
    });

    return boundaries;
  }, [visiblePhotos, selectedCategory]);

  // Initialize visible category to first category
  useEffect(() => {
    if (!selectedCategory && categories.length > 0 && !visibleCategory) {
      setVisibleCategory(categories[0]);
    }
  }, [categories, selectedCategory, visibleCategory]);

  // Setup IntersectionObserver for category detection
  useEffect(() => {
    // Only track in "All" view
    if (selectedCategory) {
      setVisibleCategory(null);
      return;
    }

    // Create observer that triggers when sentinel reaches header area
    categoryObserverRef.current = new IntersectionObserver(
      (entries) => {
        // Find the topmost intersecting sentinel
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (intersecting.length > 0) {
          const category = intersecting[0].target.getAttribute("data-category");
          if (category) {
            setVisibleCategory(category);
          }
        }
      },
      {
        // Trigger zone: from 150px below top to 60% down the viewport
        rootMargin: "-150px 0px -40% 0px",
        threshold: 0,
      }
    );

    // Observe all registered sentinels
    sentinelElementsRef.current.forEach((element) => {
      categoryObserverRef.current?.observe(element);
    });

    return () => {
      categoryObserverRef.current?.disconnect();
    };
  }, [selectedCategory, categoryBoundaries]);

  // Callback to register category sentinels
  const registerSentinel = useCallback((category: string, element: HTMLDivElement | null) => {
    if (element) {
      sentinelElementsRef.current.set(category, element);
      categoryObserverRef.current?.observe(element);
    } else {
      const existing = sentinelElementsRef.current.get(category);
      if (existing) {
        categoryObserverRef.current?.unobserve(existing);
        sentinelElementsRef.current.delete(category);
      }
    }
  }, []);

  // Callback to register photo element refs
  const registerPhotoRef = useCallback((photoUrl: string, element: HTMLDivElement | null) => {
    if (element) {
      photoRefsRef.current.set(photoUrl, element);
    } else {
      photoRefsRef.current.delete(photoUrl);
    }
  }, []);

  // Load more when sentinel enters viewport
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredPhotos.length));
  }, [filteredPhotos.length]);

  // Reset visible count when category changes
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [selectedCategory]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  // Handle lightbox open
  const handlePhotoClick = (photo: PhotoManifest, rect: DOMRect) => {
    const index = filteredPhotos.findIndex((p) => p.url === photo.url);
    setSelected({ photo, originRect: rect, openedAt: Date.now(), index, openedViaClick: true });
    setExitRect(null); // Reset exit rect when opening
    document.body.style.overflow = "hidden";

    // Update URL with photo ID
    window.history.pushState({ photoId: photo.id }, "", `/gallery/${photo.id}`);
  };

  // Get rect of current photo's grid item, scrolling if needed
  const getPhotoRect = useCallback((photo: PhotoManifest): DOMRect | null => {
    const element = photoRefsRef.current.get(photo.url);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Check if element is in viewport
    const isInView = rect.top >= 0 && rect.bottom <= viewportHeight;

    if (!isInView) {
      // Scroll element into view
      element.scrollIntoView({ behavior: "instant", block: "center" });
      // Get updated rect after scroll
      return element.getBoundingClientRect();
    }

    return rect;
  }, []);

  // Handle lightbox close - animate back to current photo's position
  const handleClose = useCallback(() => {
    if (selected) {
      // Get the current photo's grid position
      const rect = getPhotoRect(selected.photo);
      if (rect) {
        setExitRect(rect);
      }

      // Handle URL based on how lightbox was opened
      if (selected.openedViaClick) {
        // Opened via click (pushed history) → go back to pop the entry
        window.history.back();
      } else {
        // Opened via deep link or popstate → replace URL without adding history
        window.history.replaceState({}, "", "/gallery");
      }
    }

    // Small delay to allow exitRect to be set before closing
    requestAnimationFrame(() => {
      setSelected(null);
      document.body.style.overflow = "";
    });
  }, [selected, getPhotoRect]);

  // Handle lightbox navigation
  const handleNavigate = useCallback((direction: "prev" | "next") => {
    if (!selected) return;

    const newIndex = direction === "next"
      ? selected.index + 1
      : selected.index - 1;

    if (newIndex < 0 || newIndex >= filteredPhotos.length) return;

    const newPhoto = filteredPhotos[newIndex];

    // Ensure the new photo is loaded in the grid (expand visibleCount if needed)
    if (newIndex >= visibleCount) {
      setVisibleCount(Math.min(newIndex + BATCH_SIZE, filteredPhotos.length));
    }

    // Update URL with new photo ID (replaceState to avoid history spam)
    window.history.replaceState({ photoId: newPhoto.id }, "", `/gallery/${newPhoto.id}`);

    setSelected((prev) => prev ? {
      ...prev,
      photo: newPhoto,
      index: newIndex,
    } : null);
  }, [selected, filteredPhotos, visibleCount]);

  // Open photo from URL on mount (deep linking support)
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/gallery\/([^/]+)$/);

    if (match) {
      const photoId = match[1];
      // Find photo by ID in all photos (not just filtered)
      const photo = photos.find((p) => p.id === photoId);

      if (photo) {
        // Find index in filtered photos
        const index = filteredPhotos.findIndex((p) => p.id === photoId);

        // Ensure photo is loaded in visible photos
        if (index >= visibleCount) {
          setVisibleCount(Math.min(index + BATCH_SIZE, filteredPhotos.length));
        }

        // Open lightbox without animation (no origin rect available on direct access)
        // Use a placeholder rect at center of screen
        const centerRect = new DOMRect(
          window.innerWidth / 2 - 100,
          window.innerHeight / 2 - 100,
          200,
          200
        );

        setSelected({
          photo,
          originRect: centerRect,
          openedAt: Date.now(),
          index: index >= 0 ? index : 0,
          openedViaClick: false, // Deep link - don't use history.back() on close
        });
        document.body.style.overflow = "hidden";
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle browser back/forward button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.photoId) {
        // Navigate to photo from history state (forward button)
        const photo = photos.find((p) => p.id === event.state.photoId);
        if (photo) {
          const index = filteredPhotos.findIndex((p) => p.id === event.state.photoId);
          const centerRect = new DOMRect(
            window.innerWidth / 2 - 100,
            window.innerHeight / 2 - 100,
            200,
            200
          );

          setSelected({
            photo,
            originRect: centerRect,
            openedAt: Date.now(),
            index: index >= 0 ? index : 0,
            openedViaClick: false, // Opened via history navigation
          });
          document.body.style.overflow = "hidden";
        }
      } else {
        // No photo in state - close lightbox (back button pressed)
        setSelected(null);
        document.body.style.overflow = "";
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [photos, filteredPhotos]);

  // Get display label for current view
  const displayLabel = selectedCategory
    ? selectedCategory
    : visibleCategory || "All Photos";

  return (
    <div className="relative">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-sm px-4 py-6 sm:px-6">
        <div className="max-w-[1080px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl sm:text-3xl font-light tracking-[0.1em]">
              Gallery
            </h1>
            <p className="text-white/70 text-sm sm:text-base font-light mt-1 tracking-wide transition-all duration-200">
              {displayLabel}
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

      {/* Category Pills */}
      <div className="sticky top-[88px] sm:top-[96px] z-30 bg-black/80 backdrop-blur-sm px-4 py-3 sm:px-6 overflow-x-auto scrollbar-hide">
        <div className="max-w-[1080px] mx-auto flex gap-2 flex-nowrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
              selectedCategory === null
                ? "bg-white text-black"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="px-0 sm:px-4 py-4">
        <GalleryGrid
          photos={visiblePhotos}
          onPhotoClick={handlePhotoClick}
          categoryBoundaries={categoryBoundaries}
          onRegisterSentinel={registerSentinel}
          onRegisterPhotoRef={registerPhotoRef}
        />

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div ref={sentinelRef} className="h-20 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence mode="wait">
        {selected && (
          <Lightbox
            key={selected.openedAt}
            photo={selected.photo}
            originRect={selected.originRect}
            exitRect={exitRect}
            onClose={handleClose}
            onNavigate={handleNavigate}
            hasPrev={selected.index > 0}
            hasNext={selected.index < filteredPhotos.length - 1}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
