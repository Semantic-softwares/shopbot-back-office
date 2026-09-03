import { Component, OnInit, DestroyRef, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EMPTY, Subject } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreService } from '../../../shared/services/store.service';
import { TemplateService } from '../../../shared/services/template.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { Template } from '../../../shared/models/template.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { THEME_REGISTRY } from '../../../storefront/theme-engine/theme-registry';
import {
  QrTemplateService,
  QrTemplate,
  QrOptions,
} from '../../../shared/services/qr-template.service';

@Component({
  selector: 'app-self-order-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './self-order-settings.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class SelfOrderSettings implements OnInit {
  private storeService = inject(StoreService);
  private templateService = inject(TemplateService);
  private qrTemplateService = inject(QrTemplateService);
  private sanitizer = inject(DomSanitizer);
  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);
  public storeStore = inject(StoreStore);

  loading = signal(true);
  saving = signal(false);

  enabled = signal(false);
  // Independent of the general table-order print settings — off by default,
  // a store opts in deliberately to printing a ticket for unattended orders.
  autoPrintReceipt = signal(false);
  // Both default to on: each is already gated by whether the underlying data
  // exists (a table with no Wi-Fi name, a store with no contact details show
  // nothing regardless), so these exist to suppress a block a store has
  // filled in but doesn't want public.
  showWifi = signal(true);
  showContactInfo = signal(true);
  selectedTemplateSlug = signal<string>('classic');
  settingsValues = signal<Record<string, any>>({});

  // Templates are only offered if Shopbot's team has both published a DB
  // record AND shipped a matching Angular theme component — these are two
  // independent sources of truth by design (see the plan's "marketplace
  // reconciliation" note), so a stale DB entry never renders a dead choice.
  private allTemplates = signal<Template[]>([]);
  availableTemplates = computed(() =>
    this.allTemplates().filter((template) => THEME_REGISTRY.some((theme) => theme.id === template.slug)),
  );

  selectedTemplate = computed(() =>
    this.availableTemplates().find((template) => template.slug === this.selectedTemplateSlug()) ?? null,
  );

  ngOnInit(): void {
    this.initQrPreviewPipeline();
    this.loadQrTemplates();

    this.templateService.getPublishedTemplates().subscribe({
      next: (templates) => {
        this.allTemplates.set(templates);
        this.loadSettings();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Could not load storefront themes.', 'Close', { duration: 4000 });
      },
    });
  }

  private loadSettings(): void {
    const store = this.storeStore.selectedStore();
    if (store?.selfOrderSettings) {
      this.enabled.set(store.selfOrderSettings.enabled ?? false);
      this.autoPrintReceipt.set(store.selfOrderSettings.autoPrintReceipt ?? false);
      this.showWifi.set(store.selfOrderSettings.showWifi ?? true);
      this.showContactInfo.set(store.selfOrderSettings.showContactInfo ?? true);
      this.selectedTemplateSlug.set(store.selfOrderSettings.templateSlug || 'classic');
      this.settingsValues.set({ ...(store.selfOrderSettings.settingsValues || {}) });
    }
  }

  selectTemplate(template: Template): void {
    this.selectedTemplateSlug.set(template.slug);
    // Seed any not-yet-set fields with the newly selected template's defaults.
    const defaults: Record<string, any> = {};
    for (const field of template.settingsSchema) {
      if (this.settingsValues()[field.key] === undefined) {
        defaults[field.key] = field.default;
      }
    }
    this.settingsValues.update((values) => ({ ...values, ...defaults }));
  }

  updateSetting(key: string, value: any): void {
    this.settingsValues.update((values) => ({ ...values, [key]: value }));
  }

  // ===================================================================
  // Printed QR card design — separate from the storefront theme above.
  // That one styles the web menu; this one styles the physical tent card
  // customers scan at the table.
  // ===================================================================

  qrTemplates = signal<QrTemplate[]>([]);
  qrOptions = signal<QrOptions | null>(null);
  qrSelectedSlug = signal<string>('classic');
  qrSize = signal<string>('A6');
  qrLanguage = signal<string>('en');
  qrSettings = signal<Record<string, any>>({});
  qrPreviewUrl = signal<SafeResourceUrl | null>(null);
  qrPreviewLoading = signal(false);
  qrUploading = signal(false);

  qrSelectedTemplate = computed(
    () => this.qrTemplates().find((t) => t.slug === this.qrSelectedSlug()) ?? null,
  );

  /** Only the sizes the chosen design declares support for. */
  qrAvailableSizes = computed(() => {
    const supported = this.qrSelectedTemplate()?.supportedSizes;
    const all = this.qrOptions()?.sizes ?? [];
    return supported?.length ? all.filter((s) => supported.includes(s.key)) : all;
  });

  /**
   * Every preview is a real Puppeteer render on the server, so this is
   * debounced — without it, dragging a colour picker would fire a render per
   * animation frame.
   */
  private qrPreviewTrigger = new Subject<void>();
  private lastQrObjectUrl: string | null = null;

  private initQrPreviewPipeline(): void {
    this.qrPreviewTrigger
      .pipe(
        debounceTime(400),
        // A newer request supersedes one still in flight, so a fast series of
        // tweaks doesn't queue up renders or land out of order.
        switchMap(() => {
          const storeId = this.storeStore.selectedStore()?._id;
          if (!storeId) return EMPTY;
          this.qrPreviewLoading.set(true);
          return this.qrTemplateService
            .preview(storeId, {
              templateSlug: this.qrSelectedSlug(),
              size: this.qrSize(),
              language: this.qrLanguage(),
              settingsOverride: this.qrSettings(),
            })
            .pipe(catchError(() => { this.qrPreviewLoading.set(false); return EMPTY; }));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((blob) => {
        // Revoke the previous blob before replacing it — each one pins a whole
        // PDF in memory until released.
        if (this.lastQrObjectUrl) URL.revokeObjectURL(this.lastQrObjectUrl);
        this.lastQrObjectUrl = URL.createObjectURL(blob);
        // #toolbar=0 hides the embedded viewer chrome so the card fills the frame.
        this.qrPreviewUrl.set(
          this.sanitizer.bypassSecurityTrustResourceUrl(`${this.lastQrObjectUrl}#toolbar=0&navpanes=0`),
        );
        this.qrPreviewLoading.set(false);
      });
  }

  private loadQrTemplates(): void {
    this.qrTemplateService.getOptions().subscribe({
      next: (options) => this.qrOptions.set(options),
      error: () => this.snackBar.open('Could not load QR card options.', 'Close', { duration: 4000 }),
    });

    this.qrTemplateService.getTemplates().subscribe({
      next: (templates) => {
        this.qrTemplates.set(templates);
        this.seedQrDefaults();
        this.refreshQrPreview();
      },
      error: () => this.snackBar.open('Could not load QR card designs.', 'Close', { duration: 4000 }),
    });
  }

  private seedQrDefaults(): void {
    const saved = this.storeStore.selectedStore()?.selfOrderSettings?.qrTemplate;
    if (saved?.slug) this.qrSelectedSlug.set(saved.slug);
    if (saved?.defaultSize) this.qrSize.set(saved.defaultSize);
    if (saved?.defaultLanguage) this.qrLanguage.set(saved.defaultLanguage);
    this.qrSettings.set({ ...(saved?.settingsValues || {}) });

    // Fill in anything the saved values don't cover from the design's defaults.
    const template = this.qrSelectedTemplate();
    if (template) this.applyQrDefaults(template);
  }

  private applyQrDefaults(template: QrTemplate): void {
    const defaults: Record<string, any> = {};
    for (const field of template.settingsSchema || []) {
      if (this.qrSettings()[field.key] === undefined) defaults[field.key] = field.default;
    }
    this.qrSettings.update((values) => ({ ...values, ...defaults }));
  }

  selectQrTemplate(template: QrTemplate): void {
    this.qrSelectedSlug.set(template.slug);
    this.applyQrDefaults(template);

    // The previously chosen size may not exist on this design (the photo
    // template has no sticker layout, for instance) — fall back rather than
    // sending the server a combination it will reject.
    const stillValid = this.qrAvailableSizes().some((s) => s.key === this.qrSize());
    if (!stillValid && this.qrAvailableSizes().length) {
      this.qrSize.set(this.qrAvailableSizes()[0].key);
    }
    this.refreshQrPreview();
  }

  updateQrSetting(key: string, value: any): void {
    this.qrSettings.update((values) => ({ ...values, [key]: value }));
    this.refreshQrPreview();
  }

  setQrSize(size: string): void {
    this.qrSize.set(size);
    this.refreshQrPreview();
  }

  setQrLanguage(language: string): void {
    this.qrLanguage.set(language);
    this.refreshQrPreview();
  }

  refreshQrPreview(): void {
    this.qrPreviewTrigger.next();
  }

  uploadQrBackground(event: Event, key: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const storeId = this.storeStore.selectedStore()?._id;
    if (!file || !storeId) return;

    this.qrUploading.set(true);
    this.qrTemplateService.uploadBackground(storeId, file).subscribe({
      next: ({ photo }) => {
        this.qrUploading.set(false);
        this.updateQrSetting(key, photo);
        // Clear the input so re-picking the same file still fires a change.
        input.value = '';
      },
      error: () => {
        this.qrUploading.set(false);
        this.snackBar.open('Could not upload that image.', 'Close', { duration: 4000 });
      },
    });
  }

  previewUrl = computed(() => {
    const slug = this.storeStore.selectedStore()?.slug;
    return slug ? `${window.location.origin}${window.location.pathname}#/m/${slug}` : null;
  });

  openPreview(): void {
    const url = this.previewUrl();
    if (url) {
      window.open(url, '_blank');
    }
  }

  save(): void {
    const store = this.storeStore.selectedStore();
    if (!store) return;

    this.saving.set(true);
    const payload = {
      selfOrderSettings: {
        enabled: this.enabled(),
        autoPrintReceipt: this.autoPrintReceipt(),
        showWifi: this.showWifi(),
        showContactInfo: this.showContactInfo(),
        templateSlug: this.selectedTemplateSlug(),
        settingsValues: this.settingsValues(),
        qrTemplate: {
          slug: this.qrSelectedSlug(),
          defaultSize: this.qrSize(),
          defaultLanguage: this.qrLanguage(),
          settingsValues: this.qrSettings(),
        },
      },
    };

    this.storeService.updateStore(store._id, payload).subscribe({
      next: () => {
        this.storeService.getStore(store._id).subscribe({
          next: (updatedStore) => {
            this.storeStore.updateStore(updatedStore);
            this.storeService.saveStoreLocally(updatedStore);
            this.saving.set(false);
            this.snackBar.open('Self-order settings saved.', 'Close', { duration: 3000 });
          },
          error: () => {
            this.saving.set(false);
            this.snackBar.open('Saved, but failed to refresh local data.', 'Close', { duration: 4000 });
          },
        });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to save self-order settings.', 'Close', { duration: 4000 });
      },
    });
  }
}
