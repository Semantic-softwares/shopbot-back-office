/**
 * Crop-box maths, kept free of Angular and the DOM so it can be reasoned
 * about (and tested) on its own. Every rectangle here is in the source
 * image's own pixel coordinates, never screen pixels — that way a crop
 * survives the dialog being resized and maps to the output canvas directly.
 */

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

/** Smallest crop we'll allow, in source pixels. */
export const MIN_CROP = 40;

/** The largest box of the required shape, centred on the image. */
export function centredCrop(image: Size, aspectRatio?: number): CropRect {
  if (!image.width || !image.height) return { x: 0, y: 0, width: 0, height: 0 };
  if (!aspectRatio) return { x: 0, y: 0, width: image.width, height: image.height };

  let width = image.width;
  let height = width / aspectRatio;
  if (height > image.height) {
    height = image.height;
    width = height * aspectRatio;
  }
  return {
    x: (image.width - width) / 2,
    y: (image.height - height) / 2,
    width,
    height,
  };
}

/** Slides the box by (dx, dy), stopping at the image edges. */
export function moveCrop(origin: CropRect, dx: number, dy: number, image: Size): CropRect {
  return {
    ...origin,
    x: clamp(origin.x + dx, 0, image.width - origin.width),
    y: clamp(origin.y + dy, 0, image.height - origin.height),
  };
}

/**
 * Resizes from one corner, holding the diagonally opposite corner still.
 *
 * Returns the original rectangle unchanged when the result would be too small
 * or would leave the image. Rejecting outright rather than clamping one edge
 * is deliberate: clamping a single edge of an aspect-locked box silently
 * breaks its ratio, which is the whole thing the lock exists to prevent.
 */
export function resizeCrop(
  mode: Exclude<DragMode, 'move'>,
  origin: CropRect,
  dx: number,
  dy: number,
  image: Size,
  aspectRatio?: number,
): CropRect {
  const right = origin.x + origin.width;
  const bottom = origin.y + origin.height;
  const movingLeft = mode === 'nw' || mode === 'sw';
  const movingTop = mode === 'nw' || mode === 'ne';

  const x = movingLeft ? origin.x + dx : origin.x;
  let y = movingTop ? origin.y + dy : origin.y;
  const width = movingLeft ? right - x : origin.width + dx;
  let height = movingTop ? bottom - y : origin.height + dy;

  if (aspectRatio) {
    // Width leads and height follows, so the box can't drift out of shape.
    height = width / aspectRatio;
    if (movingTop) y = bottom - height;
  }

  if (width < MIN_CROP || height < MIN_CROP) return origin;
  if (x < 0 || y < 0 || x + width > image.width || y + height > image.height) return origin;

  return { x, y, width, height };
}

/**
 * Output canvas size for a crop, capped on the long edge. A 6000px phone
 * photo would otherwise become a multi-megabyte upload for a card that prints
 * at most ~200mm wide.
 */
export function outputSize(crop: CropRect, maxEdge: number): Size {
  const scale = Math.min(1, maxEdge / Math.max(crop.width, crop.height));
  return {
    width: Math.max(1, Math.round(crop.width * scale)),
    height: Math.max(1, Math.round(crop.height * scale)),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
