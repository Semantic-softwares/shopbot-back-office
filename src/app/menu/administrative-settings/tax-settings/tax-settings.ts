import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { AccountingTaxService } from '../../../shared/services/accounting-tax.service';
import { MraEinvoicingService } from '../../../shared/services/mra-einvoicing.service';
import { PricingMode, TaxView } from '../../../shared/models/tax.model';
import { StoreStore } from '../../../shared/stores/store.store';
import { TaxConfigService } from '../../../shared/tax/tax-config.service';
import { PricingModeChangeDialogComponent } from './pricing-mode-change-dialog';

/**
 * Store tax configuration: turn tax management on, the default pricing mode, the default tax and the registration number.
 * Opt-in per store: a store that has not set it up keeps pricing and printing exactly as it always did, and nothing already
 * sold is ever recalculated.
 */
@Component({
  selector: 'app-tax-settings',
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Tax" i18n-title subtitle="How tax is priced on your sales" i18n-subtitle></app-page-header>

    @if (loading()) {
      <div class="flex justify-center py-16"><mat-spinner diameter="32"></mat-spinner></div>
    } @else if (error()) {
      <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{{ error() }}</div>
    } @else if (view(); as v) {
      @if (!v.settings.taxesEnabled) {
        <!-- Not set up: explain, choose the pricing mode once, create the standard taxes -->
        <section class="rounded-lg border border-gray-200 p-5 max-w-3xl" data-testid="tax-setup">
          <h3 class="text-base font-semibold mb-1" i18n>Set up tax management</h3>
          <p class="text-sm text-gray-600 mb-4" i18n>
            Give each product its own tax, price some products with tax included and others with tax added, and show the tax on receipts and order details.
            This only applies to sales you make after setting it up. Your existing orders, receipts, products and prices are not changed.
          </p>

          <p class="text-sm font-medium mb-2" i18n>How are your product prices entered?</p>
          <mat-radio-group class="flex flex-col gap-3 mb-4" [ngModel]="setupMode()" (ngModelChange)="setupMode.set($event)" data-testid="setup-mode">
            <mat-radio-button value="exclusive">
              <span class="font-medium" i18n>Tax is added at checkout</span>
              <span class="block text-xs text-gray-500" i18n>A product at 100 with 15% VAT costs the customer 115. This is how stores that already charge a flat tax work.</span>
            </mat-radio-button>
            <mat-radio-button value="inclusive">
              <span class="font-medium" i18n>Prices already include tax</span>
              <span class="block text-xs text-gray-500" i18n>A product at 115 with 15% VAT costs the customer 115, of which 15 is VAT.</span>
            </mat-radio-button>
          </mat-radio-group>
          <p class="text-xs text-gray-500 mb-4" i18n>Individual products can override this later.</p>

          <mat-form-field appearance="outline" class="w-full max-w-sm">
            <mat-label i18n>Tax registration number (optional)</mat-label>
            <input matInput [ngModel]="registration()" (ngModelChange)="registration.set($event)" name="registration" autocomplete="off" />
          </mat-form-field>

          <div><button mat-flat-button color="primary" [disabled]="saving()" (click)="setup()" data-testid="tax-setup-button" i18n>Set up tax management</button></div>
        </section>
      } @else {
        <div class="space-y-5 max-w-3xl">
          <section class="rounded-lg border border-gray-200 p-5">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="text-base font-semibold" i18n>Tax management</h3>
                <p class="text-sm text-gray-600" i18n>When on, new sales are priced line by line with each product's tax. Turning it off only affects sales made afterwards.</p>
              </div>
              <mat-slide-toggle [checked]="v.settings.taxesEnabled" (change)="toggleEnabled($event.checked)" [disabled]="saving()" data-testid="tax-enabled"></mat-slide-toggle>
            </div>
          </section>

          <section class="rounded-lg border border-gray-200 p-5">
            <h3 class="text-base font-semibold mb-1" i18n>Default pricing mode</h3>
            <p class="text-sm text-gray-600 mb-3" i18n>Products that do not set their own mode follow this one.</p>
            <mat-radio-group class="flex flex-col gap-2" [ngModel]="v.settings.defaultPricingMode" (ngModelChange)="askModeChange($event)" data-testid="default-mode">
              <mat-radio-button value="exclusive" i18n>Tax is added at checkout (prices exclude tax)</mat-radio-button>
              <mat-radio-button value="inclusive" i18n>Prices already include tax</mat-radio-button>
            </mat-radio-group>
          </section>

          <section class="rounded-lg border border-gray-200 p-5">
            <h3 class="text-base font-semibold mb-1" i18n>Default tax</h3>
            <p class="text-sm text-gray-600 mb-3" i18n>Used for every product that has no tax of its own. Manage the list in Accounting.</p>
            <div class="flex flex-wrap items-start gap-3">
              <mat-form-field appearance="outline" class="w-72">
                <mat-label i18n>Default tax</mat-label>
                <mat-select [ngModel]="v.settings.defaultTaxId" (ngModelChange)="saveDefaultTax($event)" data-testid="default-tax">
                  @for (tax of activeTaxes(); track tax._id) {
                    <mat-option [value]="tax._id">{{ tax.name }} · {{ tax.rate }}%</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <a mat-button routerLink="/menu/erp/accounting/tax-management" data-testid="to-tax-management"><mat-icon>open_in_new</mat-icon><ng-container i18n>Manage taxes</ng-container></a>
            </div>

            <mat-form-field appearance="outline" class="w-full max-w-sm">
              <mat-label i18n>Tax registration number</mat-label>
              <input matInput [ngModel]="registration()" (ngModelChange)="registration.set($event)" name="registration" autocomplete="off" />
            </mat-form-field>
            <div><button mat-stroked-button [disabled]="saving() || registration() === v.settings.taxRegistrationNumber" (click)="saveRegistration()" i18n>Save registration number</button></div>
          </section>

          <section class="rounded-lg border border-gray-200 p-5">
            <h3 class="text-base font-semibold mb-1" i18n>Receipts</h3>
            <p class="text-sm text-gray-600" i18n>Whether the tax breakdown is printed on customer receipts is set in Point of Sale &gt; Receipt.</p>
            @if (receiptWarning()) {
              <p class="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2" data-testid="receipt-warning" i18n>
                Tax display is switched off on receipts, but this store uses MRA e-invoicing. MRA-registered businesses normally show VAT on customer receipts.
              </p>
            }
          </section>
        </div>
      }
    }
  `,
})
export class TaxSettingsPage {
  private readonly api = inject(AccountingTaxService);
  private readonly storeStore = inject(StoreStore);
  private readonly taxConfig = inject(TaxConfigService);
  private readonly fiscal = inject(MraEinvoicingService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  protected readonly view = signal<TaxView | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly setupMode = signal<PricingMode>('exclusive');
  protected readonly registration = signal('');

  protected readonly activeTaxes = computed(() => (this.view()?.taxes ?? []).filter((t) => t.isActive));
  protected readonly receiptWarning = computed(
    () => this.storeStore.selectedStore()?.posSettings?.receiptSettings?.showTax === false && !!this.fiscal.overview()?.supported,
  );

  constructor() {
    effect(() => {
      const storeId = this.storeStore.selectedStore()?._id;
      if (storeId) untracked(() => this.load(storeId));
    });
  }

  private storeId(): string {
    return this.storeStore.selectedStore()!._id;
  }

  private load(storeId: string): void {
    this.loading.set(true);
    this.api.view(storeId).subscribe({
      next: (v) => this.show(v),
      error: (e) => {
        this.error.set(this.messageOf(e));
        this.loading.set(false);
      },
    });
  }

  private show(view: TaxView): void {
    this.view.set(view);
    this.registration.set(view.settings.taxRegistrationNumber ?? '');
    this.error.set(null);
    this.loading.set(false);
    this.taxConfig.apply(view);
  }

  private messageOf(error: any): string {
    return error?.error?.message ?? $localize`Something went wrong. Please try again.`;
  }

  private run(request: ReturnType<AccountingTaxService['setup']>, done: string): void {
    this.saving.set(true);
    request.subscribe({
      next: (v) => {
        this.show(v);
        this.saving.set(false);
        this.snack.open(done, $localize`Close`, { duration: 3000 });
      },
      error: (e) => {
        this.saving.set(false);
        this.snack.open(this.messageOf(e), $localize`Close`, { duration: 6000 });
      },
    });
  }

  protected setup(): void {
    this.run(this.api.setup(this.storeId(), { defaultPricingMode: this.setupMode(), taxRegistrationNumber: this.registration() || undefined }), $localize`Tax management is on`);
  }

  protected toggleEnabled(on: boolean): void {
    this.run(this.api.updateSettings(this.storeId(), { taxesEnabled: on }), on ? $localize`Tax management is on` : $localize`Tax management is off`);
  }

  protected saveDefaultTax(taxId: string): void {
    this.run(this.api.updateSettings(this.storeId(), { defaultTaxId: taxId }), $localize`Default tax saved`);
  }

  protected saveRegistration(): void {
    this.run(this.api.updateSettings(this.storeId(), { taxRegistrationNumber: this.registration() }), $localize`Registration number saved`);
  }

  protected askModeChange(to: PricingMode): void {
    const current = this.view()?.settings.defaultPricingMode;
    if (!current || current === to) return;
    this.dialog
      .open(PricingModeChangeDialogComponent, { width: '520px', data: { storeId: this.storeId(), from: current, to, currencyCode: this.storeStore.selectedStore()?.currencyCode } })
      .afterClosed()
      .subscribe((choice?: 'pin' | 'convert') => {
        if (!choice) {
          // Put the radio back: nothing was changed.
          this.view.update((v) => (v ? { ...v } : v));
          return;
        }
        this.run(this.api.updateSettings(this.storeId(), { defaultPricingMode: to, pricingModeChange: choice }), $localize`Pricing mode changed`);
      });
  }
}
