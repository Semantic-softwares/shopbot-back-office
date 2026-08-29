import { Component, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
  private snackBar = inject(MatSnackBar);
  public storeStore = inject(StoreStore);

  loading = signal(true);
  saving = signal(false);

  enabled = signal(false);
  // Independent of the general table-order print settings — off by default,
  // a store opts in deliberately to printing a ticket for unattended orders.
  autoPrintReceipt = signal(false);
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
        templateSlug: this.selectedTemplateSlug(),
        settingsValues: this.settingsValues(),
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
