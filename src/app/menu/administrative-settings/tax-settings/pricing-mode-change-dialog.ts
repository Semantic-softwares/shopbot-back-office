import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AccountingTaxService } from '../../../shared/services/accounting-tax.service';
import { PricingMode, PricingModePreview } from '../../../shared/models/tax.model';

export interface PricingModeChangeData {
  storeId: string;
  from: PricingMode;
  to: PricingMode;
  currencyCode?: string;
}

/**
 * Changing the store's default pricing mode must never silently change what existing prices mean. The admin chooses:
 * keep every price as entered (products that follow the default are pinned to the old mode), or convert the prices so
 * customers keep paying the same.
 */
@Component({
  selector: 'app-pricing-mode-change-dialog',
  imports: [FormsModule, CurrencyPipe, MatDialogModule, MatButtonModule, MatRadioModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title i18n>Change the default pricing mode</h2>
    <mat-dialog-content class="!pt-2">
      <p class="text-sm text-gray-700 mb-3">
        @if (data.to === 'inclusive') {
          <ng-container i18n>Prices will be read as <strong>including</strong> tax from now on.</ng-container>
        } @else {
          <ng-container i18n>Prices will be read as <strong>excluding</strong> tax, and tax will be added at checkout.</ng-container>
        }
        <ng-container i18n>This only affects sales from now on. Past orders and receipts are not changed.</ng-container>
      </p>

      @if (loading()) {
        <div class="flex justify-center py-6"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {
        <mat-radio-group class="flex flex-col gap-3" [ngModel]="choice()" (ngModelChange)="choice.set($event)" data-testid="pricing-choice">
          <mat-radio-button value="pin">
            <span class="font-medium" i18n>Keep my prices as they are</span>
            <span class="block text-xs text-gray-500" i18n>Products that follow the store default stay in {{ data.from === 'inclusive' ? 'tax-inclusive' : 'tax-exclusive' }} mode, so nothing about them changes. The new mode applies to products you add from now on.</span>
          </mat-radio-button>
          <mat-radio-button value="convert">
            <span class="font-medium" i18n>Convert my prices</span>
            <span class="block text-xs text-gray-500" i18n>Products that follow the store default get a new price so customers pay the same as before. {{ preview()?.count ?? 0 }} product(s) would change.</span>
          </mat-radio-button>
        </mat-radio-group>

        @if (choice() === 'convert' && preview()?.sample?.length) {
          <div class="mt-3 max-h-48 overflow-auto rounded-md border border-gray-200 text-sm">
            @for (row of preview()!.sample; track row._id) {
              <div class="flex justify-between gap-3 px-3 py-1.5 border-b border-gray-100 last:border-0">
                <span class="truncate">{{ row.name }}</span>
                <span class="tabular-nums shrink-0">{{ row.oldPrice | currency: data.currencyCode : 'symbol' : '1.0-2' }} → {{ row.newPrice | currency: data.currencyCode : 'symbol' : '1.0-2' }}</span>
              </div>
            }
          </div>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close i18n>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="loading()" (click)="confirm()" data-testid="pricing-confirm" i18n>Change mode</button>
    </mat-dialog-actions>
  `,
})
export class PricingModeChangeDialogComponent {
  protected readonly data = inject<PricingModeChangeData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<PricingModeChangeDialogComponent, 'pin' | 'convert'>);
  private readonly api = inject(AccountingTaxService);

  protected readonly choice = signal<'pin' | 'convert'>('pin');
  protected readonly loading = signal(true);
  protected readonly preview = signal<PricingModePreview | null>(null);

  constructor() {
    this.api.pricingModePreview(this.data.storeId, this.data.to).subscribe({
      next: (p) => {
        this.preview.set(p);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected confirm(): void {
    this.ref.close(this.choice());
  }
}
