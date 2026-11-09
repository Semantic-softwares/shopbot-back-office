import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BlinkApiService } from '../../../../shared/blink/blink-api.service';
import { BlinkContextService } from '../../../../shared/blink/blink-context.service';
import { BlinkSettings, normaliseMauritiusMobile } from '../../../../shared/blink/blink.models';
import { StoreStore } from '../../../../shared/stores/store.store';

/**
 * Taking Blink payments (Emtel's wallet) at the POS: the outlet's QR string and mobile number that Emtel gave, a connection test, and the
 * switch. Mauritius stores only. The QR string is write-only: it is never shown again once saved.
 */
@Component({
  selector: 'app-blink-settings',
  imports: [DatePipe, FormsModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSlideToggleModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="px-4">
      <div class="grid grid-cols-1 gap-6">
        <app-page-header title="Blink payments" i18n-title subtitle="Let customers pay at the POS from their Blink wallet" i18n-subtitle></app-page-header>

        @if (loading()) {
          <div class="flex items-center justify-center py-8"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (loadError()) {
          <mat-card appearance="outlined"><mat-card-content class="flex flex-col items-center gap-2 !p-8 text-center" role="alert">
            <p class="m-0 font-medium"><ng-container i18n>Could not load the Blink settings.</ng-container></p>
            <button matButton="filled" (click)="load()"><ng-container i18n>Try again</ng-container></button>
          </mat-card-content></mat-card>
        } @else if (settings(); as s) {
          @if (!s.eligible) {
            <mat-card appearance="outlined"><mat-card-content class="!p-6" data-testid="blink-not-available">
              <p class="m-0 font-medium"><ng-container i18n>Blink is only available to stores in Mauritius.</ng-container></p>
            </mat-card-content></mat-card>
          } @else {
            @if (!s.platformConfigured) {
              <div class="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container" role="alert" data-testid="blink-not-configured">
                <ng-container i18n>Blink is not set up on this server yet. Ask Shopbot support to finish the connection.</ng-container>
              </div>
            }
            <mat-card appearance="outlined">
              <mat-card-content class="pt-4">
                <div class="space-y-4">
                  <p class="m-0 text-sm text-on-surface-variant"><ng-container i18n>Emtel gives each outlet its own QR string and mobile number when it approves the outlet for Blink. Paste them here. Payments go straight to your Blink account.</ng-container></p>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label><ng-container i18n>Outlet QR string</ng-container></mat-label>
                    <textarea matInput rows="3" autocomplete="off" [ngModel]="qr()" (ngModelChange)="qr.set($event)" [placeholder]="s.qrConfigured ? savedPlaceholder(s) : '000201…'" data-testid="blink-qr-input"></textarea>
                    <mat-hint><ng-container i18n>Saved securely and never shown again. Leave empty to keep the one you saved.</ng-container></mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label><ng-container i18n>Outlet mobile number</ng-container></mat-label>
                    <input matInput type="tel" inputmode="numeric" autocomplete="off" [ngModel]="mobile()" (ngModelChange)="mobile.set($event)" data-testid="blink-outlet-mobile" />
                    <span matTextPrefix class="pr-1 text-on-surface-variant">+230</span>
                    @if (mobile() && !mobileOk()) { <mat-hint class="!text-error"><ng-container i18n>8 digits starting with 5.</ng-container></mat-hint> }
                  </mat-form-field>

                  <mat-checkbox [ngModel]="confirmed()" (ngModelChange)="confirmed.set($event)" data-testid="blink-confirmed"><ng-container i18n>Emtel has approved this outlet for Blink payments</ng-container></mat-checkbox>

                  <div class="flex flex-wrap items-center gap-2">
                    <button type="button" matButton="filled" [disabled]="saving() || !dirty() || (!!mobile() && !mobileOk())" (click)="save()" data-testid="blink-save">
                      @if (saving()) { <ng-container i18n>Saving...</ng-container> } @else { <ng-container i18n>Save</ng-container> }
                    </button>
                    <button type="button" matButton="outlined" [disabled]="testing() || !s.platformConfigured" (click)="test()" data-testid="blink-test"><ng-container i18n>Test connection</ng-container></button>
                  </div>

                  @if (s.lastTestAt) {
                    <p class="m-0 flex items-center gap-2 text-sm" [class]="s.lastTestOk ? 'text-primary' : 'text-error'" data-testid="blink-test-result">
                      <mat-icon class="!h-5 !w-5 !text-xl !leading-none">{{ s.lastTestOk ? 'check_circle' : 'error' }}</mat-icon>
                      {{ s.lastTestMessage }} · {{ s.lastTestAt | date: 'short' }}
                    </p>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card appearance="outlined">
              <mat-card-content class="pt-4">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <label class="text-sm font-semibold"><ng-container i18n>Take Blink payments at the POS</ng-container></label>
                    <p class="m-0 mt-1 text-xs text-on-surface-variant"><ng-container i18n>Adds Blink to the payment screen once it is on.</ng-container></p>
                  </div>
                  <mat-slide-toggle [ngModel]="s.enabled" (ngModelChange)="toggle($event)" [disabled]="saving() || (!s.enabled && !ready())" color="primary" data-testid="blink-enabled"></mat-slide-toggle>
                </div>

                <!-- What is still missing, spelled out: the switch stays off until every line is done. -->
                @if (!s.enabled) {
                  <ul class="m-0 mt-3 flex list-none flex-col gap-1 p-0 text-sm" data-testid="blink-checklist">
                    @for (step of steps(); track step.key) {
                      <li class="flex items-center gap-2" [class]="step.done ? 'text-primary' : 'text-on-surface-variant'" [attr.data-testid]="'blink-step-' + step.key">
                        <mat-icon class="!h-5 !w-5 !text-xl !leading-none">{{ step.done ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>{{ step.label }}
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="m-0 mt-3 flex items-center gap-2 text-sm text-primary" data-testid="blink-is-on"><mat-icon class="!h-5 !w-5 !text-xl !leading-none">check_circle</mat-icon><ng-container i18n>Blink is on. Cashiers will see it on the payment screen.</ng-container></p>
                }
                @if (error()) { <p class="m-0 mt-3 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container" role="alert" data-testid="blink-settings-error">{{ error() }}</p> }
              </mat-card-content>
            </mat-card>
          }
        }
      </div>
    </div>
  `,
})
export class BlinkSettingsPage implements OnInit {
  private readonly api = inject(BlinkApiService);
  private readonly ctx = inject(BlinkContextService);
  private readonly storeStore = inject(StoreStore);
  private readonly snack = inject(MatSnackBar);

  readonly settings = signal<BlinkSettings | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly testing = signal(false);
  readonly error = signal<string | null>(null);

  readonly qr = signal('');
  readonly mobile = signal('');
  readonly confirmed = signal(false);
  readonly mobileOk = computed(() => !this.mobile() || normaliseMauritiusMobile(this.mobile()) !== null);
  readonly dirty = computed(() => {
    const s = this.settings();
    if (!s) return false;
    const mobileChanged = !!this.mobile().trim() && normaliseMauritiusMobile(this.mobile()) !== s.outletMobileNo;
    return !!this.qr().trim() || mobileChanged || this.confirmed() !== s.emtelOnboardedConfirmed;
  });

  /** What must be true before Blink can be switched on, from what the SERVER holds (not from unsaved typing). */
  readonly steps = computed(() => {
    const s = this.settings();
    return [
      { key: 'qr', done: !!s?.qrConfigured, label: $localize`Save the outlet QR string` },
      { key: 'mobile', done: !!s?.outletMobileNo, label: $localize`Save the outlet mobile number` },
      { key: 'approved', done: !!s?.emtelOnboardedConfirmed, label: $localize`Tick that Emtel approved this outlet, then press Save` },
      { key: 'saved', done: !this.dirty(), label: $localize`No unsaved changes` },
    ];
  });
  readonly ready = computed(() => this.steps().every((x) => x.done));

  ngOnInit(): void {
    this.load();
  }

  savedPlaceholder(s: BlinkSettings): string {
    return $localize`Saved (ends …${s.qrTail ?? ''})`;
  }

  load(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    this.loading.set(true);
    this.loadError.set(false);
    this.api.settings(storeId).subscribe({
      next: (s) => this.apply(s, true),
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  private apply(s: BlinkSettings, resetForm: boolean): void {
    this.settings.set(s);
    if (resetForm) {
      this.qr.set('');
      this.mobile.set(s.outletMobileNo ?? '');
      this.confirmed.set(s.emtelOnboardedConfirmed);
    }
    this.loading.set(false);
    this.ctx.refresh();
  }

  private fail(err: any): void {
    const message = err?.error?.message ?? (err?.status ? $localize`Could not save the Blink settings.` : $localize`Could not reach the server.`);
    this.error.set(message);
    this.snack.open(message, $localize`Close`, { duration: 8000 });
  }

  save(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    this.saving.set(true);
    this.error.set(null);
    this.api
      .saveSettings(storeId, { ...(this.qr().trim() ? { merchantQrString: this.qr().trim() } : {}), ...(this.mobile().trim() ? { outletMobileNo: this.mobile().trim() } : {}), emtelOnboardedConfirmed: this.confirmed() })
      .subscribe({
        next: (s) => {
          this.saving.set(false);
          this.apply(s, true);
          this.snack.open($localize`Blink settings saved`, $localize`Close`, { duration: 3000 });
        },
        error: (err) => {
          this.saving.set(false);
          this.fail(err);
        },
      });
  }

  toggle(on: boolean): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    this.saving.set(true);
    this.error.set(null);
    this.api.saveSettings(storeId, { enabled: on }).subscribe({
      next: (s) => {
        this.saving.set(false);
        this.apply(s, false);
      },
      error: (err) => {
        this.saving.set(false);
        this.fail(err);
        this.settings.update((s) => (s ? { ...s } : s)); // snap the switch back to what the server holds
      },
    });
  }

  test(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    this.testing.set(true);
    this.api.test(storeId).subscribe({
      next: (s) => {
        this.testing.set(false);
        this.settings.set(s);
      },
      error: (err) => {
        this.testing.set(false);
        this.fail(err);
      },
    });
  }
}
