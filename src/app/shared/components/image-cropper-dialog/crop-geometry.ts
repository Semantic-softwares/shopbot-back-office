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

/**
 * Fraction of the largest possible box to start at.
 *
 * Not 1. At full size a locked-aspect crop touches the image on two sides, so
 * it can only slide along one axis and every enlargement is refused — it
 * reads as a stuck rectangle. Backing off leaves room to move in both
 * directions and to grow, which is what makes the box feel draggable.
 */
export const INITIAL_CROP_SCALE = 0.86;

/** The largest box of the required shape that fits the image — the 100% crop. */
export function maxCrop(image: Size, aspectRatio?: number): Size {
  if (!image.width || !image.height) return { width: 0, height: 0 };
  if (!aspectRatio) return { width: image.width, height: image.height };

  let width = image.width;
  let height = width / aspectRatio;
  if (height > image.height) {
    height = image.height;
    width = height * aspectRatio;
  }
  return { width, height };
}

/** A box of the required shape, centred on the image, with room to move. */
export function centredCrop(image: Size, aspectRatio?: number): CropRect {
  return scaleCrop(
    { x: image.width / 2, y: image.height / 2, width: 0, height: 0 },
    image,
    INITIAL_CROP_SCALE,
    aspectRatio,
  );
}

/**
 * Resizes the crop to a fraction of the largest box that fits, keeping it
 * centred where it already is.
 *
 * This is what makes a narrow crop usable. At 100% a tall strip touches the
 * image top and bottom, so it can only slide sideways — dragging it up or
 * down does nothing, which reads as broken. Scaling it down is the only way
 * to get vertical travel, and a corner drag alone is a fiddly way to ask for
 * that.
 */
export function scaleCrop(
  crop: CropRect,
  image: Size,
  scale: number,
  aspectRatio?: number,
): CropRect {
  const max = maxCrop(image, aspectRatio);
  if (!max.width) return { x: 0, y: 0, width: 0, height: 0 };

  const width = max.width * scale;
  const height = max.height * scale;
  const centreX = crop.x + crop.width / 2;
  const centreY = crop.y + crop.height / 2;

  return {
    x: clamp(centreX - width / 2, 0, image.width - width),
    y: clamp(centreY - height / 2, 0, image.height - height),
    width,
    height,
  };
}

/** What fraction of the maximum the crop currently is, 0-1. */
export function cropScaleOf(crop: CropRect, image: Size, aspectRatio?: number): number {
  const max = maxCrop(image, aspectRatio);
  return max.width ? crop.width / max.width : 1;
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
 * When the requested size would spill off the image it is scaled back to the
 * largest box that still fits, keeping the ratio — rather than refused.
 * Refusing made the box feel stuck: dragging outward past the limit snapped it
 * back to where it started instead of growing until it hit the edge. Only a
 * result below MIN_CROP is rejected outright.
 *
 * Scaling the whole box (not clamping one edge) is what preserves the ratio,
 * which is the entire point of the lock.
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

  // The corner that stays put, and how much room there is from it.
  const anchorX = movingLeft ? right : origin.x;
  const anchorY = movingTop ? bottom : origin.y;
  const maxWidth = movingLeft ? anchorX : image.width - anchorX;
  const maxHeight = movingTop ? anchorY : image.height - anchorY;

  let width = movingLeft ? right - (origin.x + dx) : origin.width + dx;
  let height = movingTop ? bottom - (origin.y + dy) : origin.height + dy;

  if (aspectRatio) {
    // Width leads and height follows, so the box can't drift out of shape.
    height = width / aspectRatio;
  }

  // Dragging a corner past its opposite inverts the box. Bail before the fit
  // maths below, where dividing by a negative flips the scale and turns an
  // inside-out rectangle back into a huge valid-looking one.
  if (width <= 0 || height <= 0) return origin;

  // Shrink back to whatever still fits, preserving the ratio.
  const fit = Math.min(1, maxWidth / width, maxHeight / height);
  if (fit < 1) {
    width *= fit;
    height *= fit;
  }

  if (width < MIN_CROP || height < MIN_CROP) return origin;

  return {
    x: movingLeft ? anchorX - width : anchorX,
    y: movingTop ? anchorY - height : anchorY,
    width,
    height,
  };
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
