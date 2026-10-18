import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { AuditSnapshot } from '../../../shared/services/night-audit.service';

/** The report pack of one business day: the figures a manager reads the next morning. */
@Component({
  selector: 'app-audit-snapshot',
  imports: [CurrencyPipe, DecimalPipe, KeyValuePipe, MatCardModule, MatChipsModule, MatIconModule, MatTableModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (snapshot(); as s) {
      <div class="flex flex-col gap-6">
        @if (s.flash; as f) {
          <section aria-labelledby="flash-title">
            <h3 id="flash-title" class="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant"><ng-container i18n>The day at a glance</ng-container></h3>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <mat-card appearance="outlined"><mat-card-content class="!p-4"><p class="m-0 text-xs text-on-surface-variant"><ng-container i18n>Occupancy</ng-container></p><p class="m-0 text-2xl font-bold tabular-nums">{{ f.occupancy ?? 0 | number: '1.0-1' }}%</p><p class="m-0 text-xs text-on-surface-variant tabular-nums">{{ f.roomsSold }} / {{ f.sellableRooms }} <ng-container i18n>rooms</ng-container></p></mat-card-content></mat-card>
              <mat-card appearance="outlined"><mat-card-content class="!p-4"><p class="m-0 text-xs text-on-surface-variant"><ng-container i18n>Room revenue</ng-container></p><p class="m-0 text-2xl font-bold tabular-nums">{{ f.roomRevenue | currency: currency() : 'symbol' : '1.0-2' }}</p><p class="m-0 text-xs text-on-surface-variant"><ng-container i18n>before taxes and fees</ng-container></p></mat-card-content></mat-card>
              <mat-card appearance="outlined"><mat-card-content class="!p-4"><p class="m-0 text-xs text-on-surface-variant">ADR</p><p class="m-0 text-2xl font-bold tabular-nums">{{ f.adr ?? 0 | currency: currency() : 'symbol' : '1.0-2' }}</p><p class="m-0 text-xs text-on-surface-variant"><ng-container i18n>per room sold</ng-container></p></mat-card-content></mat-card>
              <mat-card appearance="outlined"><mat-card-content class="!p-4"><p class="m-0 text-xs text-on-surface-variant">RevPAR</p><p class="m-0 text-2xl font-bold tabular-nums">{{ f.revpar ?? 0 | currency: currency() : 'symbol' : '1.0-2' }}</p><p class="m-0 text-xs text-on-surface-variant"><ng-container i18n>per available room</ng-container></p></mat-card-content></mat-card>
            </div>
            <mat-chip-set class="mt-3" aria-label="Movements" i18n-aria-label>
              <mat-chip><mat-icon matChipAvatar>login</mat-icon><ng-container i18n>Arrivals</ng-container>&nbsp;<b>{{ f.arrivals }}</b></mat-chip>
              <mat-chip><mat-icon matChipAvatar>logout</mat-icon><ng-container i18n>Departures</ng-container>&nbsp;<b>{{ f.departures }}</b></mat-chip>
              <mat-chip><mat-icon matChipAvatar>person_off</mat-icon><ng-container i18n>No-shows</ng-container>&nbsp;<b>{{ f.noShows }}</b></mat-chip>
              <mat-chip><mat-icon matChipAvatar>groups</mat-icon><ng-container i18n>Guests staying</ng-container>&nbsp;<b>{{ f.guests }}</b></mat-chip>
            </mat-chip-set>
          </section>
        }

        @if (s.trialBalance; as tb) {
          <section aria-labelledby="tb-title">
            <div class="mb-2 flex items-center gap-2">
              <h3 id="tb-title" class="m-0 text-sm font-semibold uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Trial balance</ng-container></h3>
              <mat-chip-set><mat-chip [highlighted]="tb.balanced" [class]="tb.balanced ? '' : '!bg-error-container'"><mat-icon matChipAvatar>{{ tb.balanced ? 'check_circle' : 'error' }}</mat-icon>@if (tb.balanced) {<ng-container i18n>Balanced</ng-container>} @else {<ng-container i18n>Out of balance</ng-container>}</mat-chip></mat-chip-set>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <mat-card appearance="outlined">
                <div class="overflow-x-auto">
                  <table mat-table [dataSource]="balanceRows()" class="w-full">
                    <ng-container matColumnDef="label"><th mat-header-cell *matHeaderCellDef class="!sr-only"><ng-container i18n>Line</ng-container></th><td mat-cell *matCellDef="let r" [class.!font-semibold]="r.total">{{ r.label }}</td></ng-container>
                    <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef class="!sr-only"><ng-container i18n>Amount</ng-container></th><td mat-cell *matCellDef="let r" class="!text-right tabular-nums" [class.!font-semibold]="r.total" [class.!text-green-700]="r.credit">{{ r.credit ? '− ' : r.sign ? '+ ' : '' }}{{ r.amount | currency: currency() : 'symbol' : '1.2-2' }}</td></ng-container>
                    <tr mat-row *matRowDef="let row; columns: ['label', 'amount']"></tr>
                  </table>
                </div>
              </mat-card>
              <mat-card appearance="outlined">
                <div class="overflow-x-auto">
                  <table mat-table [dataSource]="buckets()" class="w-full">
                    <ng-container matColumnDef="where"><th mat-header-cell *matHeaderCellDef><ng-container i18n>Where the balance sits</ng-container></th><td mat-cell *matCellDef="let b">{{ b.label }}</td></ng-container>
                    <ng-container matColumnDef="count"><th mat-header-cell *matHeaderCellDef class="text-right"><ng-container i18n>Stays</ng-container></th><td mat-cell *matCellDef="let b" class="text-right tabular-nums">{{ b.count }}</td></ng-container>
                    <ng-container matColumnDef="net"><th mat-header-cell *matHeaderCellDef class="text-right"><ng-container i18n>Net</ng-container></th><td mat-cell *matCellDef="let b" class="text-right tabular-nums" [class.!text-error]="b.alert">{{ b.net | currency: currency() : 'symbol' : '1.2-2' }}</td></ng-container>
                    <tr mat-header-row *matHeaderRowDef="['where', 'count', 'net']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['where', 'count', 'net']"></tr>
                  </table>
                </div>
              </mat-card>
            </div>
          </section>
        }

        <div class="grid gap-4 md:grid-cols-2">
          <section aria-labelledby="rev-title">
            <h3 id="rev-title" class="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Charges posted today, by code</ng-container></h3>
            <mat-card appearance="outlined">
              @if (s.revenueByCode.length) {
                <div class="overflow-x-auto"><table mat-table [dataSource]="s.revenueByCode" class="w-full">
                  <ng-container matColumnDef="code"><th mat-header-cell *matHeaderCellDef><ng-container i18n>Code</ng-container></th><td mat-cell *matCellDef="let r" class="!font-mono !text-sm">{{ r.code }}</td></ng-container>
                  <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>Amount</ng-container></th><td mat-cell *matCellDef="let r" class="!text-right tabular-nums">{{ r.amount | currency: currency() : 'symbol' : '1.2-2' }}</td></ng-container>
                  <tr mat-header-row *matHeaderRowDef="['code', 'amount']"></tr>
                  <tr mat-row *matRowDef="let row; columns: ['code', 'amount']"></tr>
                </table></div>
              } @else {
                <mat-card-content class="!p-4 text-sm text-on-surface-variant"><ng-container i18n>Nothing was charged today.</ng-container></mat-card-content>
              }
            </mat-card>
          </section>

          <section aria-labelledby="pay-title">
            <h3 id="pay-title" class="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Money taken today, by method</ng-container></h3>
            <mat-card appearance="outlined">
              @if ((s.paymentsByMethod | keyvalue).length) {
                <div class="overflow-x-auto"><table mat-table [dataSource]="paymentRows()" class="w-full">
                  <ng-container matColumnDef="method"><th mat-header-cell *matHeaderCellDef><ng-container i18n>Method</ng-container></th><td mat-cell *matCellDef="let r" class="!capitalize">{{ r.method }}</td></ng-container>
                  <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>Amount</ng-container></th><td mat-cell *matCellDef="let r" class="!text-right tabular-nums">{{ r.amount | currency: currency() : 'symbol' : '1.2-2' }}</td></ng-container>
                  <tr mat-header-row *matHeaderRowDef="['method', 'amount']"></tr>
                  <tr mat-row *matRowDef="let row; columns: ['method', 'amount']"></tr>
                </table></div>
              } @else {
                <mat-card-content class="!p-4 text-sm text-on-surface-variant"><ng-container i18n>No payments were taken today.</ng-container></mat-card-content>
              }
              @if (s.shifts.length) {
                <mat-card-footer class="!px-4 !pb-3 text-xs text-on-surface-variant"><ng-container i18n>{{ s.shifts.length }} cashier shift(s) closed today</ng-container>@if (shiftVariance() !== 0) { · <span [class.text-error]="shiftVariance() < 0">{{ shiftVariance() > 0 ? '+' : '' }}{{ shiftVariance() | number: '1.0-2' }} <ng-container i18n>cash difference in total</ng-container></span>}</mat-card-footer>
              }
            </mat-card>
          </section>
        </div>

        @if (s.earlierNightAdjustments?.length) {
          <section aria-labelledby="adj-title">
            <h3 id="adj-title" class="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Added today for earlier nights</ng-container></h3>
            <p class="m-0 mb-2 text-sm text-on-surface-variant"><ng-container i18n>Approved historical corrections. These are not part of this day's revenue above.</ng-container></p>
            <div class="overflow-x-auto"><table mat-table [dataSource]="s.earlierNightAdjustments!" class="w-full">
              <ng-container matColumnDef="code"><th mat-header-cell *matHeaderCellDef><ng-container i18n>Code</ng-container></th><td mat-cell *matCellDef="let r" class="!font-mono !text-sm">{{ r.code }}</td></ng-container>
              <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef class="!text-right"><ng-container i18n>Amount</ng-container></th><td mat-cell *matCellDef="let r" class="!text-right tabular-nums">{{ r.amount | currency: currency() : 'symbol' : '1.2-2' }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="['code', 'amount']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['code', 'amount']"></tr>
            </table></div>
          </section>
        }

        @if (s.overrides.length) {
          <section aria-labelledby="ov-title">
            <h3 id="ov-title" class="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Signed off by a manager</ng-container></h3>
            <mat-card appearance="outlined">
              <div class="overflow-x-auto"><table mat-table [dataSource]="s.overrides" class="w-full">
                <ng-container matColumnDef="code"><th mat-header-cell *matHeaderCellDef><ng-container i18n>Blocker</ng-container></th><td mat-cell *matCellDef="let o" class="!font-mono !text-xs">{{ o.code }}</td></ng-container>
                <ng-container matColumnDef="reason"><th mat-header-cell *matHeaderCellDef><ng-container i18n>Reason given</ng-container></th><td mat-cell *matCellDef="let o" class="!whitespace-normal !py-2">{{ o.reason }}</td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['code', 'reason']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['code', 'reason']"></tr>
              </table></div>
            </mat-card>
          </section>
        }
      </div>
    }
  `,
})
export class AuditSnapshotComponent {
  snapshot = input<AuditSnapshot | null | undefined>(null);
  currency = input<string>('');
  shiftVariance = computed(() => (this.snapshot()?.shifts ?? []).reduce((sum, s) => sum + (s.variance ?? 0), 0));

  paymentRows = computed(() => Object.entries(this.snapshot()?.paymentsByMethod ?? {}).map(([method, amount]) => ({ method: method.replace('_', ' '), amount })));
  balanceRows = computed(() => {
    const tb = this.snapshot()?.trialBalance;
    if (!tb) return [];
    return [
      { label: $localize`Opening`, amount: tb.opening },
      { label: $localize`Charges today`, amount: tb.debits, sign: true },
      { label: $localize`Payments and credits today`, amount: tb.credits, credit: true },
      { label: $localize`Closing: owed by guests`, amount: tb.closing, total: true },
    ] as { label: string; amount: number; sign?: boolean; credit?: boolean; total?: boolean }[];
  });

  buckets = computed(() => {
    const b = this.snapshot()?.trialBalance?.buckets;
    if (!b) return [];
    return [
      { label: $localize`Staying now`, ...b.inHouse, alert: false },
      { label: $localize`Paid ahead (advance deposits)`, ...b.advance, alert: false },
      { label: $localize`Checked out`, ...b.departed, alert: b.departed.net > 0 },
      { label: $localize`Cancelled / no-show`, ...b.closed, alert: false },
    ];
  });
}
