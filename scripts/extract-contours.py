#!/usr/bin/env python3
"""
Bridal Party Contour Extractor

This script uses rembg for background removal and OpenCV for contour extraction
to generate precise SVG path data for each person in the bridal party photo.

Usage:
    python3 scripts/extract-contours.py

Output:
    - Generates precise contour paths in normalized (0-1) coordinates
    - Updates data/bridal-party-contours.json with the new paths
"""

import json
import sys
from pathlib import Path
from io import BytesIO

import cv2
import numpy as np
from PIL import Image
from rembg import remove

# Image dimensions
IMG_WIDTH = 1920
IMG_HEIGHT = 1280

# Person metadata (assigned after auto-detection, left to right)
PERSON_METADATA = [
    {"id": "bridesmaid-1", "name": "Name 1", "role": "Bridesmaid"},
    {"id": "bridesmaid-2", "name": "Name 2", "role": "Bridesmaid"},
    {"id": "bride", "name": "Name 3", "role": "Bride"},
    {"id": "groom", "name": "Name 4", "role": "Groom"},
    {"id": "groomsman-1", "name": "Name 5", "role": "Groomsman"},
    {"id": "groomsman-2", "name": "Name 6", "role": "Groomsman"},
]


def download_image(url: str) -> np.ndarray:
    """Download image from URL and return as numpy array."""
    import urllib.request

    print(f"Downloading image from {url[:50]}...")
    with urllib.request.urlopen(url) as response:
        image_data = response.read()

    # Convert to PIL Image then to numpy array
    pil_image = Image.open(BytesIO(image_data))
    # Convert to RGB if necessary
    if pil_image.mode != 'RGB':
        pil_image = pil_image.convert('RGB')
    return np.array(pil_image)


def remove_background(image: np.ndarray) -> np.ndarray:
    """Remove background from image using rembg."""
    print("Removing background (this may take a moment)...")

    # Convert numpy array to PIL Image
    pil_image = Image.fromarray(image)

    # Remove background
    output = remove(pil_image)

    # Convert back to numpy array
    result = np.array(output)

    # Extract alpha channel as mask
    if result.shape[2] == 4:
        mask = result[:, :, 3]
    else:
        # Fallback: convert to grayscale
        mask = cv2.cvtColor(result, cv2.COLOR_RGB2GRAY)

    return mask


def find_valleys(mask: np.ndarray, num_valleys: int = 5, min_person_width: int = 100) -> list:
    """
    Find the valleys (natural separation points) between people in the mask.
    Uses vertical projection with proper local minima detection.

    Args:
        mask: Binary mask
        num_valleys: Number of valleys to find (num_people - 1)
        min_person_width: Minimum width of a person in pixels

    Returns:
        List of x-coordinates where valleys occur
    """
    # Calculate vertical projection (sum of white pixels per column)
    projection = np.sum(mask > 127, axis=0)

    # Find the group boundaries
    nonzero = np.where(projection > 0)[0]
    if len(nonzero) == 0:
        return []

    left_bound = nonzero[0]
    right_bound = nonzero[-1]
    region_width = right_bound - left_bound

    print(f"  Group spans x={left_bound} to x={right_bound} (width={region_width})")

    # Smooth the projection more aggressively
    kernel_size = 31
    smoothed = np.convolve(projection, np.ones(kernel_size)/kernel_size, mode='same')

    # Find ALL local minima using gradient sign changes
    search_region = smoothed[left_bound:right_bound]
    gradient = np.diff(search_region)

    # Local minima: where gradient goes from negative to positive
    local_minima = []
    for i in range(1, len(gradient)):
        if gradient[i-1] < 0 and gradient[i] >= 0:
            x = left_bound + i
            depth = smoothed[x]
            # Calculate prominence (how deep is this valley relative to neighbors)
            left_peak = np.max(smoothed[max(left_bound, x-100):x])
            right_peak = np.max(smoothed[x:min(right_bound, x+100)])
            prominence = min(left_peak, right_peak) - depth
            local_minima.append((x, depth, prominence))

    print(f"  Found {len(local_minima)} local minima")

    if len(local_minima) == 0:
        # Fallback to equal division
        segment = region_width // (num_valleys + 1)
        return [left_bound + segment * (i + 1) for i in range(num_valleys)]

    # Sort by prominence (most significant valleys first)
    local_minima.sort(key=lambda x: -x[2])

    # Select valleys with minimum spacing constraint
    selected_valleys = []
    for x, depth, prominence in local_minima:
        # Check if this valley is far enough from already selected ones
        too_close = False
        for sv in selected_valleys:
            if abs(x - sv) < min_person_width:
                too_close = True
                break

        if not too_close:
            selected_valleys.append(x)
            print(f"    Selected valley at x={x} (depth={depth:.0f}, prominence={prominence:.0f})")

            if len(selected_valleys) >= num_valleys:
                break

    # If we didn't find enough valleys, add fallback positions
    if len(selected_valleys) < num_valleys:
        print(f"  Warning: Only found {len(selected_valleys)} valleys, adding fallback positions")
        segment = region_width // (num_valleys + 1)
        for i in range(num_valleys):
            fallback_x = left_bound + segment * (i + 1)
            # Only add if not too close to existing
            too_close = any(abs(fallback_x - sv) < min_person_width // 2 for sv in selected_valleys)
            if not too_close and len(selected_valleys) < num_valleys:
                selected_valleys.append(fallback_x)
                print(f"    Added fallback valley at x={fallback_x}")

    return sorted(selected_valleys)[:num_valleys]


def find_bride_groom_boundary(hsv: np.ndarray, binary_mask: np.ndarray) -> int:
    """
    Find the vertical boundary between bride (dress) and groom (suit).
    Uses multiple strategies and picks the best one.

    Returns:
        x-coordinate of the bride/groom boundary
    """
    height, width = binary_mask.shape

    # Strategy 1: Find the deepest valley in the middle region of the full mask
    # This should be the natural separation between bride and groom
    projection = np.sum(binary_mask > 127, axis=0)

    # Smooth aggressively
    kernel_size = 41
    smoothed = np.convolve(projection, np.ones(kernel_size)/kernel_size, mode='same')

    # Search in the middle 40% of the image (where bride/groom boundary should be)
    middle_start = int(width * 0.4)
    middle_end = int(width * 0.6)

    # Find the minimum (deepest valley) in this region
    middle_region = smoothed[middle_start:middle_end]
    if len(middle_region) > 0:
        min_idx = np.argmin(middle_region)
        valley_boundary = middle_start + min_idx
        valley_depth = smoothed[valley_boundary]

        # Also check prominence of this valley
        left_max = np.max(smoothed[max(0, valley_boundary-150):valley_boundary])
        right_max = np.max(smoothed[valley_boundary:min(width, valley_boundary+150)])
        prominence = min(left_max, right_max) - valley_depth

        print(f"  Valley-based boundary: x={valley_boundary} (depth={valley_depth:.0f}, prominence={prominence:.0f})")

    # Strategy 2: Color-based detection (suit color)
    suit_lower = np.array([90, 15, 15])
    suit_upper = np.array([145, 255, 180])
    suit_color_mask = cv2.inRange(hsv, suit_lower, suit_upper)
    suit_mask = cv2.bitwise_and(suit_color_mask, binary_mask)

    suit_projection = np.sum(suit_mask > 0, axis=0)

    # Find where suit becomes dominant (not just first appearance)
    # Look for where cumulative suit pixels exceed a threshold
    cumsum = np.cumsum(suit_projection)
    total_suit = cumsum[-1] if len(cumsum) > 0 else 0

    if total_suit > 0:
        # Find where 10% of suit pixels have been seen
        threshold = total_suit * 0.10
        color_boundary_candidates = np.where(cumsum > threshold)[0]
        if len(color_boundary_candidates) > 0:
            color_boundary = color_boundary_candidates[0]
            print(f"  Color-based boundary: x={color_boundary}")

            # PREFER color boundary as it marks where suits actually start
            # Only use valley if it's very close to color boundary AND shallower
            if abs(valley_boundary - color_boundary) < 50:
                # They agree closely, use valley for precision
                boundary = valley_boundary
            else:
                # They disagree significantly - trust color (suits start here)
                # Add small offset to not cut into bride's dress
                boundary = color_boundary - 10
                print(f"  Using color boundary (adjusted): x={boundary}")
        else:
            boundary = valley_boundary
    else:
        boundary = valley_boundary

    print(f"  Final Bride/Groom boundary: x={boundary}")

    return boundary


def find_all_people_contours_with_color(mask: np.ndarray, original_image: np.ndarray, num_people: int = 6, epsilon_factor: float = 0.002) -> list:
    """
    Find people using the full foreground mask but with color-based group separation.

    Strategy:
    1. Use full foreground mask (from rembg) for accurate silhouettes
    2. Use color to find bride/groom boundary
    3. Split into dress region (left) and suit region (right)
    4. Find valleys within each region using the full mask
    5. Extract full-body contours from the original foreground mask

    Args:
        mask: Binary mask of the entire image (foreground from rembg)
        original_image: Original RGB image for color analysis
        num_people: Expected number of people (3 dresses, 3 suits)
        epsilon_factor: Contour simplification factor

    Returns:
        List of contour point lists, sorted by x-position (left to right)
    """
    # Apply threshold to ensure binary mask
    _, binary_mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)

    # Clean up the mask
    kernel = np.ones((5, 5), np.uint8)
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel)

    # Convert to HSV for color analysis
    hsv = cv2.cvtColor(original_image, cv2.COLOR_RGB2HSV)

    # Find the bride/groom boundary using color
    bride_groom_boundary = find_bride_groom_boundary(hsv, binary_mask)

    # Create dress region mask (left side - bridesmaids + bride)
    dress_region_mask = np.zeros_like(binary_mask)
    dress_region_mask[:, :bride_groom_boundary] = binary_mask[:, :bride_groom_boundary]

    # Create suit region mask (right side - groom + groomsmen)
    suit_region_mask = np.zeros_like(binary_mask)
    suit_region_mask[:, bride_groom_boundary:] = binary_mask[:, bride_groom_boundary:]

    # Save debug masks
    cv2.imwrite("/tmp/dress-region-mask.png", dress_region_mask)
    cv2.imwrite("/tmp/suit-region-mask.png", suit_region_mask)
    print(f"  Saved region masks to /tmp/")

    # Find valleys in each region using the full foreground mask
    print("\n  Finding valleys in dress region...")
    dress_valleys = find_valleys(dress_region_mask, 2)  # 2 valleys for 3 people

    print("  Finding valleys in suit region...")
    suit_valleys = find_valleys(suit_region_mask, 2)  # 2 valleys for 3 people

    # Get bounding boxes
    dress_coords = cv2.findNonZero(dress_region_mask)
    suit_coords = cv2.findNonZero(suit_region_mask)

    if dress_coords is None:
        print("  Warning: No dress region found")
        return []
    if suit_coords is None:
        print("  Warning: No suit region found")
        return []

    dx, dy, dw, dh = cv2.boundingRect(dress_coords)
    sx, sy, sw, sh = cv2.boundingRect(suit_coords)

    print(f"  Dress region bounds: x={dx}-{dx+dw}")
    print(f"  Suit region bounds: x={sx}-{sx+sw}")

    # Create separators for each group
    dress_separators = [dx] + dress_valleys + [bride_groom_boundary]
    suit_separators = [bride_groom_boundary] + suit_valleys + [sx + sw]

    print(f"  Dress separators: {dress_separators}")
    print(f"  Suit separators: {suit_separators}")

    result = []

    # Process dress wearers (3 people: 2 bridesmaids + bride)
    print("\n  Processing dress wearers (using full foreground mask)...")
    for i in range(3):
        left = dress_separators[i] if i < len(dress_separators) else dx
        right = dress_separators[i + 1] if i + 1 < len(dress_separators) else bride_groom_boundary

        # Create slice mask from FULL foreground mask (not just dress color)
        person_mask = np.zeros_like(binary_mask)
        person_mask[:, left:right] = binary_mask[:, left:right]

        # Find contours
        contours, _ = cv2.findContours(person_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            print(f"    Dress person {i+1}: No contours found")
            continue

        largest_contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest_contour)

        epsilon = epsilon_factor * cv2.arcLength(largest_contour, True)
        simplified = cv2.approxPolyDP(largest_contour, epsilon, True)
        points = [(int(p[0][0]), int(p[0][1])) for p in simplified]

        M = cv2.moments(largest_contour)
        cx = int(M["m10"] / M["m00"]) if M["m00"] > 0 else (left + right) // 2

        print(f"    Dress person {i+1} (x={left}-{right}, center={cx}): {len(points)} points, area={area:.0f}")
        result.append((cx, points, "dress"))

    # Process suit wearers (3 people: groom + 2 groomsmen)
    print("\n  Processing suit wearers (using full foreground mask)...")
    for i in range(3):
        left = suit_separators[i] if i < len(suit_separators) else bride_groom_boundary
        right = suit_separators[i + 1] if i + 1 < len(suit_separators) else sx + sw

        # Create slice mask from FULL foreground mask
        person_mask = np.zeros_like(binary_mask)
        person_mask[:, left:right] = binary_mask[:, left:right]

        # Find contours
        contours, _ = cv2.findContours(person_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            print(f"    Suit person {i+1}: No contours found")
            continue

        largest_contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest_contour)

        epsilon = epsilon_factor * cv2.arcLength(largest_contour, True)
        simplified = cv2.approxPolyDP(largest_contour, epsilon, True)
        points = [(int(p[0][0]), int(p[0][1])) for p in simplified]

        M = cv2.moments(largest_contour)
        cx = int(M["m10"] / M["m00"]) if M["m00"] > 0 else (left + right) // 2

        print(f"    Suit person {i+1} (x={left}-{right}, center={cx}): {len(points)} points, area={area:.0f}")
        result.append((cx, points, "suit"))

    # Sort all by x position
    result.sort(key=lambda x: x[0])

    # Save visualization with different colors per person
    vis = cv2.cvtColor(original_image.copy(), cv2.COLOR_RGB2BGR)
    colors = [
        (255, 100, 100), (100, 255, 100), (255, 200, 100),  # Dresses: light colors
        (100, 100, 255), (200, 100, 255), (100, 200, 255)   # Suits: blue-ish
    ]
    for i, (cx, points, ptype) in enumerate(result):
        color = colors[i % len(colors)]
        pts = np.array(points, dtype=np.int32)
        cv2.polylines(vis, [pts], True, color, 3)
        # Draw index number
        cv2.putText(vis, f"{i+1}", (cx, 100), cv2.FONT_HERSHEY_SIMPLEX, 2, color, 3)

    # Draw the bride/groom boundary line
    cv2.line(vis, (bride_groom_boundary, 0), (bride_groom_boundary, IMG_HEIGHT), (0, 255, 255), 2)

    cv2.imwrite("/tmp/color-segmentation-result.png", vis)
    print(f"\n  Saved visualization to /tmp/color-segmentation-result.png")

    return [points for _, points, _ in result]


def find_all_people_contours(mask: np.ndarray, num_people: int = 6, epsilon_factor: float = 0.002) -> list:
    """
    Wrapper that delegates to color-aware segmentation if original image is available.
    Falls back to watershed if not.
    """
    # This will be called with original_image from main()
    # For now, return empty - main() will call the color version directly
    return []


def extract_contour_for_region(mask: np.ndarray, x_start: int, x_end: int, epsilon_factor: float = 0.001) -> list:
    """
    Extract contour for a specific horizontal region of the mask.
    (Kept for backward compatibility)
    """
    height, width = mask.shape
    region_mask = np.zeros_like(mask)
    region_mask[:, x_start:x_end] = mask[:, x_start:x_end]
    contours, _ = cv2.findContours(region_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return []
    largest_contour = max(contours, key=cv2.contourArea)
    epsilon = epsilon_factor * cv2.arcLength(largest_contour, True)
    simplified = cv2.approxPolyDP(largest_contour, epsilon, True)
    return [(int(p[0][0]), int(p[0][1])) for p in simplified]


def points_to_svg_path(points: list, width: int, height: int) -> str:
    """
    Convert a list of (x, y) points to an SVG path string with normalized coordinates.

    Args:
        points: List of (x, y) coordinate tuples
        width: Image width for normalization
        height: Image height for normalization

    Returns:
        SVG path data string (e.g., "M0.1,0.2 L0.15,0.25 ...")
    """
    if not points:
        return ""

    # Start with Move command
    x, y = points[0]
    path_parts = [f"M{x/width:.4f},{y/height:.4f}"]

    # Add Line commands for remaining points
    for x, y in points[1:]:
        path_parts.append(f"L{x/width:.4f},{y/height:.4f}")

    # Close the path
    path_parts.append("Z")

    return " ".join(path_parts)


def calculate_name_tag_anchor(points: list, width: int, height: int) -> dict:
    """Calculate the name tag anchor position (top-center of the contour)."""
    if not points:
        return {"x": 0.5, "y": 0.3}

    # Find the topmost point and center x
    min_y = min(p[1] for p in points)
    xs = [p[0] for p in points]
    center_x = (min(xs) + max(xs)) / 2

    # Position slightly above the head
    return {
        "x": round(center_x / width, 4),
        "y": round((min_y - 50) / height, 4)  # 50 pixels above head
    }


def calculate_hit_area(points: list, width: int, height: int) -> dict:
    """Calculate the bounding box for hover detection."""
    if not points:
        return {"x": 0, "y": 0, "width": 0.1, "height": 0.5}

    xs = [p[0] for p in points]
    ys = [p[1] for p in points]

    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    # Add some padding
    padding = 10

    return {
        "x": round((min_x - padding) / width, 4),
        "y": round((min_y - padding) / height, 4),
        "width": round((max_x - min_x + 2 * padding) / width, 4),
        "height": round((max_y - min_y + 2 * padding) / height, 4)
    }


def main():
    # Image URL from manifest
    image_url = "https://utfs.io/f/iZFFzGDNq7lh3tIU6M7r9L3iFXtzfBgvCSMZpAc16jmGEOoa"

    # Always download the original image for color-based segmentation
    original_image = download_image(image_url)
    print(f"Image shape: {original_image.shape}")

    # Check if we already have the mask
    mask_path = Path("/tmp/bridal-party-mask.png")
    if mask_path.exists():
        print(f"Loading existing mask from {mask_path}")
        mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
    else:
        # Remove background to get foreground mask
        mask = remove_background(original_image)
        print(f"Mask shape: {mask.shape}")

        # Save mask for debugging
        cv2.imwrite(str(mask_path), mask)
        print(f"Saved mask to {mask_path}")

    # Use color-aware segmentation to find all people
    print("\nFinding all people using color-aware segmentation...")
    all_contours = find_all_people_contours_with_color(mask, original_image, num_people=6, epsilon_factor=0.0015)

    if len(all_contours) != 6:
        print(f"\n⚠️  Warning: Found {len(all_contours)} contours, expected 6")
        print("  The mask may have connected people or missing detections")

    # Build members list
    members = []
    for i, points in enumerate(all_contours):
        if i < len(PERSON_METADATA):
            metadata = PERSON_METADATA[i]
        else:
            metadata = {"id": f"person-{i+1}", "name": f"Name {i+1}", "role": "Member"}

        print(f"\nProcessing {metadata['id']} ({len(points)} points)...")

        # Convert to SVG path
        path_data = points_to_svg_path(points, IMG_WIDTH, IMG_HEIGHT)

        # Calculate anchor and hit area
        name_tag_anchor = calculate_name_tag_anchor(points, IMG_WIDTH, IMG_HEIGHT)
        hit_area = calculate_hit_area(points, IMG_WIDTH, IMG_HEIGHT)

        members.append({
            "id": metadata["id"],
            "name": metadata["name"],
            "role": metadata["role"],
            "pathData": path_data,
            "nameTagAnchor": name_tag_anchor,
            "hitArea": hit_area
        })

    # Create output data
    output_data = {
        "photoId": "iZFFzGDNq7lh3tIU6M7r9L3iFXtzfBgvCSMZpAc16jmGEOoa",
        "members": members
    }

    # Write to file
    output_path = Path(__file__).parent.parent / "data" / "bridal-party-contours.json"
    with open(output_path, "w") as f:
        json.dump(output_data, f, indent=2)

    print(f"\n✓ Saved contour data to {output_path}")
    print(f"  Total members processed: {len(members)}")

    # Also print the JSON for review
    print("\n--- Generated JSON ---")
    print(json.dumps(output_data, indent=2))


if __name__ == "__main__":
    main()
