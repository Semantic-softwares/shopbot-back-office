import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PartnerPortalApiService, PortalCommission } from './partner-portal-api.service';
import { PartnerPortalContext } from './partner-portal-context.service';

const TONE: Record<string, string> = { expected: 'bg-indigo-100 text-indigo-900', in_review: 'bg-amber-100 text-amber-900', approved: 'bg-blue-100 text-blue-900', paid: 'bg-green-100 text-green-900', void: 'bg-gray-100 text-gray-700' };
const TEXT: Record<string, () => string> = {
  expected: () => $localize`Expected`, in_review: () => $localize`Being checked by the hotel`, approved: () => $localize`Approved`, paid: () => $localize`Paid`, void: () => $localize`Cancelled`,
};
const METHOD: Record<string, () => string> = {
  bank_transfer: () => $localize`Bank transfer`, cash: () => $localize`Cash`, cheque: () => $localize`Cheque`, card: () => $localize`Card`, mobile_money: () => $localize`Mobile money`, other: () => $localize`Other`,
};

/** What the hotel owes this partner: the totals, each booking's commission, and every payment the hotel has recorded. */
@Component({
  selector: 'app-partner-commissions',
  imports: [CurrencyPipe, DatePipe, MatButtonModule, MatChipsModule, MatIconModule, MatPaginatorModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h1 class="m-0 mb-4 text-2xl font-semibold" i18n>My commissions</h1>
    @if (summary(); as s) {
      <div class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        @for (k of kpis(); track k.label) {
          <div class="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
            <div class="text-xs uppercase tracking-wide text-on-surface-variant">{{ k.label }}</div>
            <div class="mt-1 text-xl font-semibold tabular-nums">@if (k.money) { {{ k.value | currency: s.currency : 'symbol' : '1.0-2' }} } @else { {{ k.value }} }</div>
            @if (k.hint) { <div class="text-xs text-on-surface-variant">{{ k.hint }}</div> }
          </div>
        }
      </div>
    }
    <mat-chip-listbox class="mb-3" [value]="status()" (change)="setStatus($event.value)" aria-label="Filter by status" i18n-aria-label>
      @for (o of statuses; track o.value) { <mat-chip-option [value]="o.value">{{ o.label }}</mat-chip-option> }
    </mat-chip-listbox>
    @if (loading() && !data()) { <mat-progress-bar mode="indeterminate" /> }
    @if (failed()) {
      <div class="flex flex-col items-center gap-2 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-900" role="alert"><p class="m-0 font-semibold" i18n>Could not load your commissions.</p><button matButton="filled" (click)="reload()" i18n>Try again</button></div>
    } @else if (data()) {
      @if (rows().length === 0) {
        <div class="flex flex-col items-center gap-2 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-10 text-center">
          <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-on-surface-variant">payments</mat-icon>
          <p class="m-0 font-medium" i18n>No commissions here yet.</p>
          <p class="m-0 max-w-md text-sm text-on-surface-variant" i18n>A commission appears when a booking under an agreement that pays one is confirmed.</p>
        </div>
      }
      <ul class="m-0 flex list-none flex-col gap-3 p-0">
        @for (c of rows(); track c._id) {
          <li class="flex flex-col gap-2 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-4">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold">{{ c.confirmationNumber }}</span>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="tone(c.status)">{{ statusText(c.status) }}</span>
              <span class="text-sm text-on-surface-variant">{{ c.leadGuest }} · {{ c.checkIn | date: 'd MMM' }} – {{ c.checkOut | date: 'd MMM y' }}@if (c.partnerReference) { · {{ c.partnerReference }} }</span>
            </div>
            <div class="grid grid-cols-3 gap-3 text-sm">
              <div><div class="text-xs text-on-surface-variant" i18n>Commission</div><div class="font-semibold tabular-nums">{{ c.amount | currency: c.currency : 'symbol' : '1.0-2' }}</div></div>
              <div><div class="text-xs text-on-surface-variant" i18n>Paid to you</div><div class="tabular-nums">{{ c.paid | currency: c.currency : 'symbol' : '1.0-2' }}</div></div>
              <div><div class="text-xs text-on-surface-variant" i18n>Still to come</div><div class="tabular-nums">{{ c.outstanding | currency: c.currency : 'symbol' : '1.0-2' }}</div></div>
            </div>
            @if (c.payments.length) {
              <ul class="m-0 flex list-none flex-col gap-1 p-0 text-sm">
                @for (p of c.payments; track $index) {
                  <li class="flex flex-wrap justify-between gap-2 rounded-xl bg-surface-container px-3 py-2"><span>{{ p.date | date: 'd MMM y' }} · {{ method(p.method) }}@if (p.reference) { · {{ p.reference }} }</span><span class="font-medium tabular-nums">{{ p.amount | currency: c.currency : 'symbol' : '1.0-2' }}</span></li>
                }
              </ul>
            }
          </li>
        }
      </ul>
      <mat-paginator [length]="data()!.total" [pageSize]="pageSize" [pageIndex]="page() - 1" [hidePageSize]="true" (page)="onPage($event)" aria-label="Pages" i18n-aria-label />
    }
  `,
})
export class PartnerCommissionsComponent {
  private readonly api = inject(PartnerPortalApiService);
  private readonly ctx = inject(PartnerPortalContext);

  readonly statuses = [
    { value: 'all', label: $localize`All` }, { value: 'expected', label: $localize`Expected` }, { value: 'approved', label: $localize`Approved` }, { value: 'paid', label: $localize`Paid` },
  ];
  readonly status = signal('all');
  readonly page = signal(1);
  readonly pageSize = 15;
  private readonly refresh = signal(0);
  private readonly storeId = computed(() => this.ctx.current()?.storeId ?? '');

  private readonly sumRes = rxResource({ params: () => ({ id: this.storeId(), n: this.refresh() }), stream: ({ params }) => (params.id ? this.api.commissionSummary(params.id) : of(null)) });
  readonly summary = computed(() => (this.sumRes.hasValue() ? this.sumRes.value() : null));
  private readonly res = rxResource({
    params: () => ({ id: this.storeId(), status: this.status(), page: this.page(), n: this.refresh() }),
    stream: ({ params }) => (params.id ? this.api.commissions(params.id, { status: params.status, page: params.page, limit: this.pageSize }) : of(null)),
  });
  readonly data = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly rows = computed<PortalCommission[]>(() => this.data()?.commissions ?? []);
  readonly loading = computed(() => this.res.isLoading());
  readonly failed = computed(() => !!this.res.error() && !this.data());

  readonly kpis = computed(() => {
    const s = this.summary();
    if (!s) return [];
    return [
      { label: $localize`Bookings`, value: s.bookings, hint: $localize`${s.completedStays} completed`, money: false },
      { label: $localize`Room nights`, value: s.roomNights, hint: '', money: false },
      { label: $localize`Expected`, value: s.expected, hint: $localize`stays still to come`, money: true },
      { label: $localize`Being checked`, value: s.inReview, hint: $localize`stay done, hotel to approve`, money: true },
      { label: $localize`Approved, to be paid`, value: s.owed, hint: '', money: true },
      { label: $localize`Paid to you`, value: s.paid, hint: '', money: true },
    ];
  });

  tone = (s: string) => TONE[s] ?? TONE['void'];
  statusText = (s: string) => TEXT[s]?.() ?? s;
  method = (m?: string) => (m ? METHOD[m]?.() ?? m : '');
  setStatus(v: string | null) { this.status.set(v ?? 'all'); this.page.set(1); }
  onPage(e: PageEvent) { this.page.set(e.pageIndex + 1); }
  reload() { this.refresh.update((n) => n + 1); }
}
