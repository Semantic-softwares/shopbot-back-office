import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  CropRect,
  DragMode,
  centredCrop,
  cropScaleOf,
  moveCrop,
  outputSize,
  resizeCrop,
  scaleCrop,
} from './crop-geometry';

export interface ImageCropperDialogData {
  file: File;
  /** width ÷ height the result must have. Omit to let the user crop freely. */
  aspectRatio?: number;
  title?: string;
  /** Shown under the title — where this photo ends up on the card. */
  hint?: string;
}

/**
 * Crops an image before upload.
 *
 * Hand-rolled on a canvas rather than pulling in a cropper library: the ones
 * that would fit don't publish an Angular 22 build yet, and the whole job here
 * is one draggable rectangle plus a single drawImage call.
 *
 * This class owns only the pointer plumbing and the canvas export; the crop
 * maths lives in ./crop-geometry, free of Angular and the DOM.
 */
@Component({
  selector: 'app-image-cropper-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './image-cropper-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageCropperDialogComponent implements OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<ImageCropperDialogComponent, Blob | null>);
  protected readonly data = inject<ImageCropperDialogData>(MAT_DIALOG_DATA);

  @ViewChild('stage') private stageRef?: ElementRef<HTMLElement>;

  protected readonly imageUrl = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly working = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Natural size of the source image. */
  private readonly natural = signal({ width: 0, height: 0 });
  /**
   * Where the fitted image sits inside the stage, in CSS pixels. Compared by
   * value because it is re-measured on every pointerdown and on every resize
   * notification, and an unchanged stage should not redraw the overlay.
   */
  private readonly fitted = signal(
    { left: 0, top: 0, width: 0, height: 0 },
    {
      equal: (a, b) =>
        a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height,
    },
  );
  protected readonly crop = signal<CropRect>({ x: 0, y: 0, width: 0, height: 0 });

  /** Locked unless the user switches to free crop. */
  protected readonly lockAspect = signal(true);
  private get aspect(): number | undefined {
    return this.lockAspect() ? this.data.aspectRatio : undefined;
  }

  private objectUrl: string | null = null;
  private image: HTMLImageElement | null = null;
  private resize: ResizeObserver | null = null;
  private drag: {
    mode: DragMode;
    startX: number;
    startY: number;
    origin: CropRect;
  } | null = null;

  /** The crop box in stage pixels, for positioning the overlay. */
  protected readonly cropStyle = computed(() => {
    const f = this.fitted();
    const n = this.natural();
    const c = this.crop();
    if (!n.width || !f.width) return { display: 'none' };
    const scale = f.width / n.width;
    return {
      left: `${f.left + c.x * scale}px`,
      top: `${f.top + c.y * scale}px`,
      width: `${c.width * scale}px`,
      height: `${c.height * scale}px`,
    };
  });

  /**
   * How big the frame is as a share of the largest that fits. Derived from the
   * crop rather than stored, so dragging a corner keeps the slider in step.
   */
  protected readonly cropScale = computed(() =>
    Math.round(cropScaleOf(this.crop(), this.natural(), this.aspect) * 100),
  );

  /** Resizes the frame around its current centre — the slider's handler. */
  setCropScale(percent: number): void {
    this.crop.set(scaleCrop(this.crop(), this.natural(), percent / 100, this.aspect));
  }

  protected readonly outputSize = computed(() => {
    const c = this.crop();
    return `${Math.round(c.width)} × ${Math.round(c.height)}`;
  });

  constructor() {
    this.load();
  }

  private load(): void {
    const url = URL.createObjectURL(this.data.file);
    this.objectUrl = url;
    this.imageUrl.set(url);

    const img = new Image();
    img.onload = () => {
      this.image = img;
      this.natural.set({ width: img.naturalWidth, height: img.naturalHeight });
      this.resetCrop();
      this.loading.set(false);
      // The stage only has a size once the image has rendered into it.
      requestAnimationFrame(() => this.measure());
    };
    img.onerror = () => {
      this.error.set("That file couldn't be read as an image.");
      this.loading.set(false);
    };
    img.src = url;
  }

  /** Largest box of the required shape, centred on the image. */
  protected resetCrop(): void {
    this.crop.set(centredCrop(this.natural(), this.aspect));
  }

  protected toggleLock(): void {
    this.lockAspect.update((v) => !v);
    this.resetCrop();
  }

  /**
   * Recomputes where the contain-fitted image actually sits in the stage.
   *
   * Deliberately clientWidth/clientHeight and not getBoundingClientRect().
   * Material opens a dialog at `transform: scale(0.8)` and transitions it to
   * none, and a bounding rect reports the *transformed* box — so measuring
   * during those 150ms, which is exactly when the image finishes decoding,
   * fitted the overlay to a phantom rectangle about 80% of the real one. The
   * frame then drew short of the photo on every side and clamped before
   * reaching its edges: on a 924×1600 photo roughly 83px of it could not be
   * selected at all. Layout dimensions ignore transforms, so they are correct
   * on the first frame and stay correct.
   */
  protected measure(): void {
    const stage = this.stageRef?.nativeElement;
    const n = this.natural();
    if (!stage || !n.width) return;

    const box = { width: stage.clientWidth, height: stage.clientHeight };
    if (!box.width || !box.height) return;

    const scale = Math.min(box.width / n.width, box.height / n.height);
    const width = n.width * scale;
    const height = n.height * scale;
    this.fitted.set({
      left: (box.width - width) / 2,
      top: (box.height - height) / 2,
      width,
      height,
    });

    this.watchStage(stage);
  }

  /**
   * Re-measures when the stage itself changes size — a window resize, or the
   * dialog reflowing. Transforms don't trigger this (they aren't layout), which
   * is why measure() must be transform-proof in its own right.
   */
  private watchStage(stage: HTMLElement): void {
    if (this.resize || typeof ResizeObserver === 'undefined') return;
    this.resize = new ResizeObserver(() => this.measure());
    this.resize.observe(stage);
  }

  protected onPointerDown(event: PointerEvent, mode: DragMode): void {
    event.preventDefault();
    event.stopPropagation();
    // The mapping between screen and image pixels has to be right at the
    // instant the drag starts, whatever happened to the layout beforehand.
    this.measure();
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    this.drag = { mode, startX: event.clientX, startY: event.clientY, origin: { ...this.crop() } };
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.drag) return;
    const f = this.fitted();
    const n = this.natural();
    if (!f.width) return;

    // Screen pixels back into image pixels.
    const scale = n.width / f.width;
    const dx = (event.clientX - this.drag.startX) * scale;
    const dy = (event.clientY - this.drag.startY) * scale;

    this.crop.set(
      this.drag.mode === 'move'
        ? moveCrop(this.drag.origin, dx, dy, n)
        : resizeCrop(this.drag.mode, this.drag.origin, dx, dy, n, this.aspect),
    );
  }

  protected onPointerUp(): void {
    this.drag = null;
  }

  protected async confirm(): Promise<void> {
    if (!this.image) return;
    this.working.set(true);

    const c = this.crop();
    const out = outputSize(c, 2000);
    const canvas = document.createElement('canvas');
    canvas.width = out.width;
    canvas.height = out.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.error.set('Your browser could not process this image.');
      this.working.set(false);
      return;
    }
    ctx.drawImage(this.image, c.x, c.y, c.width, c.height, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9),
    );
    this.working.set(false);
    if (!blob) {
      this.error.set('Could not produce the cropped image.');
      return;
    }
    this.dialogRef.close(blob);
  }

  protected cancel(): void {
    this.dialogRef.close(null);
  }

  ngOnDestroy(): void {
    this.resize?.disconnect();
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
  }
}
