import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreService } from '../../../../shared/services/store.service';
import {
  ImageCropperDialogComponent,
  ImageCropperDialogData,
} from '../../../../shared/components/image-cropper-dialog/image-cropper-dialog.component';
import {
  LANDING_HIGHLIGHT_ICONS,
  LandingHighlight,
  LandingPageSettings,
} from '../../../../shared/models/landing-page.model';

const MAX_VIDEO_MB = 40;

/**
 * Editor for the storefront home page (selfOrderSettings.landingPage). Holds
 * no state of its own: it edits the parent's `value`, which the Self-Order
 * page saves with the rest of its settings.
 */
@Component({
  selector: 'app-landing-page-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './landing-page-settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageSettingsComponent {
  private readonly storeService = inject(StoreService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly value = model.required<LandingPageSettings>();
  readonly storeId = input.required<string>();
  readonly storeName = input<string>('');
  readonly storeLogo = input<string | undefined>();
  readonly storeBanner = input<string | undefined>();
  readonly storeDescription = input<string | undefined>();

  protected readonly icons = LANDING_HIGHLIGHT_ICONS;
  protected readonly maxVideoMb = MAX_VIDEO_MB;

  protected readonly uploadingImage = signal(false);
  /** 0–100 while a video uploads, null otherwise. */
  protected readonly videoProgress = signal<number | null>(null);

  /** What the page will actually show, blanks resolved the way the storefront resolves them. */
  protected readonly preview = computed(() => {
    const v = this.value();
    return {
      logoText: v.logoText.trim() || this.storeName(),
      image: v.backgroundImage || this.storeBanner() || '',
      video: v.backgroundType === 'video' ? v.backgroundVideo : '',
      subtext:
        v.subtext.trim() ||
        this.storeDescription() ||
        `Order from ${this.storeName()} in a few taps — for pickup, delivery or right at your table.`,
      highlights: v.showHighlights ? v.highlights.filter((h) => h.title.trim()) : [],
    };
  });

  protected set<K extends keyof LandingPageSettings>(key: K, val: LandingPageSettings[K]): void {
    this.value.update((v) => ({ ...v, [key]: val }));
  }

  protected setHighlight(index: number, patch: Partial<LandingHighlight>): void {
    this.value.update((v) => ({
      ...v,
      highlights: v.highlights.map((h, i) => (i === index ? { ...h, ...patch } : h)),
    }));
  }

  protected pickImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please choose an image file.', 'Close', { duration: 4000 });
      return;
    }

    this.dialog
      .open(ImageCropperDialogComponent, {
        width: '720px',
        maxWidth: '95vw',
        data: {
          file,
          aspectRatio: 16 / 9,
          title: 'Crop background image',
          hint: 'Wide images work best. On computers the text sits on the left, so keep the main subject to the right.',
        } satisfies ImageCropperDialogData,
      })
      .afterClosed()
      .subscribe((blob?: Blob | null) => {
        if (!blob) return;
        this.uploadingImage.set(true);
        this.storeService
          .uploadLandingMedia(this.storeId(), new File([blob], 'home-background.jpg', { type: 'image/jpeg' }))
          .subscribe({
            next: (event) => {
              if (event.type !== HttpEventType.Response) return;
              this.uploadingImage.set(false);
              this.set('backgroundImage', event.body!.photo);
            },
            error: () => {
              this.uploadingImage.set(false);
              this.snackBar.open('Could not upload that image.', 'Close', { duration: 4000 });
            },
          });
      });
  }

  protected pickVideo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      this.snackBar.open('Please choose a video file (MP4 or WebM).', 'Close', { duration: 4000 });
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      this.snackBar.open(`That video is over ${MAX_VIDEO_MB} MB. Trim or compress it and try again.`, 'Close', {
        duration: 6000,
      });
      return;
    }

    this.videoProgress.set(0);
    this.storeService.uploadLandingMedia(this.storeId(), file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          // The last stretch is Cloudinary processing, so hold at 95 until it answers.
          this.videoProgress.set(Math.min(95, Math.round((event.loaded / event.total) * 100)));
        } else if (event.type === HttpEventType.Response) {
          this.videoProgress.set(null);
          this.set('backgroundVideo', event.body!.photo);
        }
      },
      error: () => {
        this.videoProgress.set(null);
        this.snackBar.open('Could not upload that video.', 'Close', { duration: 4000 });
      },
    });
  }
}
