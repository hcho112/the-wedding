export type ImageVariant = {
    width: number;
    height: number;
    relativePath?: string; // Used in local metadata
    url?: string;         // Used in remote manifest
};

export type ImageMetadata = {
    originalName: string;
    relativePathBase: string; // e.g. "Ceremony/Afternoon"
    variants: {
        mobile: ImageVariant;
        tablet: ImageVariant;
        desktop: ImageVariant;
        full: ImageVariant;
    };
    blurDataUrl: string;
};

export interface PhotoManifest {
    id: string;
    category: string;
    timeOfDay: string;
    blurDataUrl: string;
    // Variants map
    variants: {
        mobile?: ImageVariant;
        tablet?: ImageVariant;
        desktop?: ImageVariant;
        full?: ImageVariant;
    };
    // Fallback (usually Desktop or Full)
    url: string;
    width: number;
    height: number;
}

// Bridal Party Interactive Photo Types
export type PersonContour = {
    id: string;
    name: string;
    role: string;
    // SVG path in normalized coordinates (0-1 range)
    pathData: string;
    // Anchor point for floating name tag (normalized 0-1)
    nameTagAnchor: { x: number; y: number };
    // Bounding box for hover detection (normalized 0-1)
    hitArea: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
};

export type BridalPartyData = {
    photoId: string;
    members: PersonContour[];
};

// Sound Manifest Types
export type SoundTrack = {
    id: string;
    title: string;
    category: string;       // Maps to photo category (e.g., "Preparation 10AM")
    filename: string;       // Original filename
    url?: string;           // Remote URL after upload
    duration?: number;      // Duration in seconds (if available)
};

export type SoundManifest = {
    defaultTrack: string;   // ID of the default track
    tracks: SoundTrack[];
};
