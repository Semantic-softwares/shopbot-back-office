import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuditSnapshot } from '../../../shared/services/night-audit.service';

/** The report pack of one business day: the figures a manager reads the next morning. */
@Component({
  selector: 'app-audit-snapshot',
  imports: [CurrencyPipe, DecimalPipe, KeyValuePipe, MatIconModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (snapshot(); as s) {
      <div class="flex flex-col gap-6">
        @if (s.flash; as f) {
          <section aria-labelledby="flash-title">
            <h3 id="flash-title" class="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500"><ng-container i18n>The day at a glance</ng-container></h3>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div class="rounded-lg border border-gray-200 p-3"><div class="text-xs text-gray-500"><ng-container i18n>Occupancy</ng-container></div><div class="text-2xl font-bold tabular-nums">{{ f.occupancy ?? 0 | number: '1.0-1' }}%</div><div class="text-xs text-gray-500 tabular-nums">{{ f.roomsSold }} / {{ f.sellableRooms }} <ng-container i18n>rooms</ng-container></div></div>
              <div class="rounded-lg border border-gray-200 p-3"><div class="text-xs text-gray-500"><ng-container i18n>Room revenue</ng-container></div><div class="text-2xl font-bold tabular-nums">{{ f.roomRevenue | currency: currency() : 'symbol' : '1.0-2' }}</div><div class="text-xs text-gray-500"><ng-container i18n>before taxes and fees</ng-container></div></div>
              <div class="rounded-lg border border-gray-200 p-3"><div class="text-xs text-gray-500">ADR</div><div class="text-2xl font-bold tabular-nums">{{ f.adr ?? 0 | currency: currency() : 'symbol' : '1.0-2' }}</div><div class="text-xs text-gray-500"><ng-container i18n>per room sold</ng-container></div></div>
              <div class="rounded-lg border border-gray-200 p-3"><div class="text-xs text-gray-500">RevPAR</div><div class="text-2xl font-bold tabular-nums">{{ f.revpar ?? 0 | currency: currency() : 'symbol' : '1.0-2' }}</div><div class="text-xs text-gray-500"><ng-container i18n>per available room</ng-container></div></div>
            </div>
            <p class="m-0 mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600 tabular-nums">
              <span><ng-container i18n>Arrivals</ng-container> <b class="ml-1">{{ f.arrivals }}</b></span>
              <span><ng-container i18n>Departures</ng-container> <b class="ml-1">{{ f.departures }}</b></span>
              <span><ng-container i18n>No-shows</ng-container> <b class="ml-1">{{ f.noShows }}</b></span>
              <span><ng-container i18n>Guests staying</ng-container> <b class="ml-1">{{ f.guests }}</b></span>
            </p>
          </section>
        }

        @if (s.trialBalance; as tb) {
          <section aria-labelledby="tb-title">
            <div class="mb-2 flex items-center gap-2">
              <h3 id="tb-title" class="m-0 text-sm font-semibold uppercase tracking-wide text-gray-500"><ng-container i18n>Trial balance</ng-container></h3>
              <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" [class]="tb.balanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                <mat-icon class="!h-4 !w-4 !text-base !leading-none">{{ tb.balanced ? 'check_circle' : 'error' }}</mat-icon>
                @if (tb.balanced) {<ng-container i18n>Balanced</ng-container>} @else {<ng-container i18n>Out of balance</ng-container>}
              </span>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <dl class="m-0 flex flex-col gap-1.5 rounded-lg border border-gray-200 p-3 text-sm tabular-nums">
                <div class="flex justify-between"><dt class="text-gray-600"><ng-container i18n>Opening</ng-container></dt><dd class="m-0">{{ tb.opening | currency: currency() : 'symbol' : '1.2-2' }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-600"><ng-container i18n>Charges today</ng-container></dt><dd class="m-0">+ {{ tb.debits | currency: currency() : 'symbol' : '1.2-2' }}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-600"><ng-container i18n>Payments and credits today</ng-container></dt><dd class="m-0 text-green-700">− {{ tb.credits | currency: currency() : 'symbol' : '1.2-2' }}</dd></div>
                <div class="flex justify-between border-t border-gray-200 pt-1.5 font-semibold"><dt><ng-container i18n>Closing: owed by guests</ng-container></dt><dd class="m-0">{{ tb.closing | currency: currency() : 'symbol' : '1.2-2' }}</dd></div>
              </dl>
              <table class="w-full border-collapse rounded-lg border border-gray-200 text-sm tabular-nums">
                <thead><tr class="text-left text-xs text-gray-500"><th class="p-2" scope="col"><ng-container i18n>Where the balance sits</ng-container></th><th class="p-2 text-right" scope="col"><ng-container i18n>Stays</ng-container></th><th class="p-2 text-right" scope="col"><ng-container i18n>Net</ng-container></th></tr></thead>
                <tbody>
                  <tr class="border-t border-gray-200"><td class="p-2"><ng-container i18n>Staying now</ng-container></td><td class="p-2 text-right">{{ tb.buckets.inHouse.count }}</td><td class="p-2 text-right">{{ tb.buckets.inHouse.net | currency: currency() : 'symbol' : '1.2-2' }}</td></tr>
                  <tr class="border-t border-gray-200"><td class="p-2"><ng-container i18n>Paid ahead (advance deposits)</ng-container></td><td class="p-2 text-right">{{ tb.buckets.advance.count }}</td><td class="p-2 text-right">{{ tb.buckets.advance.net | currency: currency() : 'symbol' : '1.2-2' }}</td></tr>
                  <tr class="border-t border-gray-200"><td class="p-2"><ng-container i18n>Checked out</ng-container></td><td class="p-2 text-right">{{ tb.buckets.departed.count }}</td><td class="p-2 text-right" [class.text-red-700]="tb.buckets.departed.net > 0">{{ tb.buckets.departed.net | currency: currency() : 'symbol' : '1.2-2' }}</td></tr>
                  <tr class="border-t border-gray-200"><td class="p-2"><ng-container i18n>Cancelled / no-show</ng-container></td><td class="p-2 text-right">{{ tb.buckets.closed.count }}</td><td class="p-2 text-right">{{ tb.buckets.closed.net | currency: currency() : 'symbol' : '1.2-2' }}</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        }

        <div class="grid gap-4 md:grid-cols-2">
          <section aria-labelledby="rev-title">
            <h3 id="rev-title" class="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500"><ng-container i18n>Charges posted today, by code</ng-container></h3>
            @if (s.revenueByCode.length) {
              <dl class="m-0 flex flex-col gap-1.5 rounded-lg border border-gray-200 p-3 text-sm tabular-nums">
                @for (row of s.revenueByCode; track row.code) {
                  <div class="flex justify-between"><dt class="font-mono text-xs text-gray-600">{{ row.code }}</dt><dd class="m-0">{{ row.amount | currency: currency() : 'symbol' : '1.2-2' }}</dd></div>
                }
              </dl>
            } @else {
              <p class="m-0 text-sm text-gray-500"><ng-container i18n>Nothing was charged today.</ng-container></p>
            }
          </section>

          <section aria-labelledby="pay-title">
            <h3 id="pay-title" class="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500"><ng-container i18n>Money taken today, by method</ng-container></h3>
            @if ((s.paymentsByMethod | keyvalue).length) {
              <dl class="m-0 flex flex-col gap-1.5 rounded-lg border border-gray-200 p-3 text-sm tabular-nums">
                @for (row of s.paymentsByMethod | keyvalue; track row.key) {
                  <div class="flex justify-between"><dt class="text-gray-600">{{ row.key.replace('_', ' ') }}</dt><dd class="m-0">{{ row.value | currency: currency() : 'symbol' : '1.2-2' }}</dd></div>
                }
              </dl>
            } @else {
              <p class="m-0 text-sm text-gray-500"><ng-container i18n>No payments were taken today.</ng-container></p>
            }
            @if (s.shifts.length) {
              <p class="m-0 mt-2 text-xs text-gray-500"><ng-container i18n>{{ s.shifts.length }} cashier shift(s) closed today</ng-container>@if (shiftVariance() !== 0) { · <span [class.text-red-700]="shiftVariance() < 0">{{ shiftVariance() > 0 ? '+' : '' }}{{ shiftVariance() | number: '1.0-2' }} <ng-container i18n>cash difference in total</ng-container></span>}</p>
            }
          </section>
        </div>

        @if (s.overrides.length) {
          <section aria-labelledby="ov-title">
            <h3 id="ov-title" class="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500"><ng-container i18n>Signed off by a manager</ng-container></h3>
            <ul class="m-0 flex list-none flex-col gap-1 p-0 text-sm">
              @for (o of s.overrides; track o.code) {
                <li class="rounded-lg bg-amber-50 px-3 py-2 text-amber-900"><span class="font-mono text-xs">{{ o.code }}</span>: {{ o.reason }}</li>
              }
            </ul>
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
}
