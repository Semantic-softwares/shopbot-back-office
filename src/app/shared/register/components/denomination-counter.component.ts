import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Denomination, CountRow } from '../register.models';
import { fromMinor, sumRows } from '../register-money';

/**
 * A count of notes and coins: one row per denomination of the store's currency, a quantity for each, the total worked out as you type.
 * It only collects numbers; the server adds the count up again itself and never trusts the total shown here.
 */
@Component({
  selector: 'app-denomination-counter',
  imports: [CurrencyPipe, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="rounded-lg border border-outline-variant" data-testid="denomination-counter">
      <div class="grid grid-cols-[1fr_5.5rem_1fr] gap-2 border-b border-outline-variant bg-surface-container px-3 py-2 text-xs font-medium uppercase tracking-wide text-on-surface-variant">
        <span><ng-container i18n>Note or coin</ng-container></span>
        <span class="text-center"><ng-container i18n>Quantity</ng-container></span>
        <span class="text-right"><ng-container i18n>Total</ng-container></span>
      </div>
      <div class="max-h-72 overflow-y-auto">
        @for (d of denominations(); track d.valueMinor) {
          <div class="grid grid-cols-[1fr_5.5rem_1fr] items-center gap-2 px-3 py-1.5" [attr.data-testid]="'denom-row-' + d.valueMinor">
            <span class="flex items-center gap-2 text-sm">
              <mat-icon class="!h-5 !w-5 !text-xl !leading-none text-on-surface-variant">{{ d.kind === 'note' ? 'payments' : 'toll' }}</mat-icon>
              {{ major(d.valueMinor) | currency: currency() : 'symbol' : (exponent() ? '1.2-2' : '1.0-0') }}
            </span>
            <input
              type="number"
              inputmode="numeric"
              min="0"
              step="1"
              class="w-full rounded-md border border-outline bg-surface px-2 py-1 text-center text-sm text-on-surface"
              [attr.aria-label]="'Quantity of ' + d.valueMinor"
              [ngModel]="quantity(d.valueMinor)"
              (ngModelChange)="set(d.valueMinor, $event)"
              [attr.data-testid]="'denom-qty-' + d.valueMinor"
            />
            <span class="text-right text-sm tabular-nums text-on-surface-variant">{{ major(d.valueMinor * quantity(d.valueMinor)) | currency: currency() : 'symbol' : (exponent() ? '1.2-2' : '1.0-0') }}</span>
          </div>
        }
      </div>
      <div class="flex items-center justify-between border-t border-outline-variant bg-surface-container px-3 py-2 text-sm font-semibold">
        <span><ng-container i18n>Total counted</ng-container></span>
        <span class="tabular-nums" data-testid="denom-total">{{ major(totalMinor()) | currency: currency() : 'symbol' : (exponent() ? '1.2-2' : '1.0-0') }}</span>
      </div>
    </div>
  `,
})
export class DenominationCounterComponent {
  denominations = input.required<Denomination[]>();
  exponent = input(2);
  currency = input('');
  /** Quantity per denomination, by its value in minor units. */
  quantities = model<Record<number, number>>({});
  totalChange = output<number>();

  rows = computed<CountRow[]>(() => this.denominations().map((d) => ({ valueMinor: d.valueMinor, quantity: this.quantity(d.valueMinor) })).filter((r) => r.quantity > 0));
  totalMinor = computed(() => sumRows(this.rows()));

  quantity(valueMinor: number): number {
    return Math.max(0, Math.floor(Number(this.quantities()[valueMinor]) || 0));
  }

  set(valueMinor: number, raw: unknown): void {
    const next = { ...this.quantities(), [valueMinor]: Math.max(0, Math.floor(Number(raw) || 0)) };
    this.quantities.set(next);
    this.totalChange.emit(sumRows(this.denominations().map((d) => ({ valueMinor: d.valueMinor, quantity: Number(next[d.valueMinor]) || 0 }))));
  }

  major(minor: number): number {
    return fromMinor(minor, this.exponent());
  }
}
