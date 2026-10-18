import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Offer, PartnerPortalApiService, Unavailable, messageOf } from './partner-portal-api.service';
import { PartnerPortalContext } from './partner-portal-context.service';
import { PartnerBookingDialogComponent } from './partner-booking-dialog';

const addDays = (day: string, n: number) => new Date(Date.parse(day + 'T00:00:00Z') + n * 86_400_000).toISOString().slice(0, 10);
const ymdOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dateOf = (day: string) => new Date(`${day}T12:00:00`);
const todayLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

const MAX_ROOMS = 10;
const REASONS: Record<string, (u: Unavailable) => string> = {
  SOLD_OUT: (u) => (u.available ? $localize`Only ${u.available} left, not enough for the number of rooms you asked for` : $localize`Sold out for these dates`),
  STOP_SELL: () => $localize`Not on sale for these dates`,
  CLOSED_TO_ARRIVAL: () => $localize`Arrival is not possible on this day`,
  CLOSED_TO_DEPARTURE: () => $localize`Departure is not possible on this day`,
  MIN_STAY: (u) => $localize`Minimum stay is ${u.minStay} nights`,
  MAX_STAY: (u) => $localize`Maximum stay is ${u.minStay} nights`,
};

/** Find rooms at the partner's own agreed rates for a stay, choose how many of each, and ask the hotel for them in one request. */
@Component({
  selector: 'app-partner-search',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, MatButtonModule, MatDatepickerModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h1 class="m-0 mb-4 text-2xl font-semibold" i18n>Find rooms</h1>
    <form [formGroup]="form" (ngSubmit)="search()" class="mb-5 grid grid-cols-2 gap-x-3 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-4 pb-1 md:grid-cols-[2fr_8rem_auto] md:items-start">
      <mat-form-field appearance="outline" class="col-span-2 md:col-span-1">
        <mat-label i18n>Check-in – Check-out</mat-label>
        <mat-date-range-input [rangePicker]="picker" [min]="minDate" formGroupName="period">
          <input matStartDate formControlName="start" placeholder="Check-in" i18n-placeholder />
          <input matEndDate formControlName="end" placeholder="Check-out" i18n-placeholder />
        </mat-date-range-input>
        <mat-datepicker-toggle matSuffix [for]="picker" />
        <mat-date-range-picker #picker />
        @if (form.controls.period.touched && form.controls.period.invalid) { <mat-error i18n>Choose your check-in and check-out dates.</mat-error> }
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label i18n>Adults</mat-label><input matInput type="number" min="1" max="40" formControlName="adults" /></mat-form-field>
      <button matButton="filled" type="submit" class="!h-14" [disabled]="loading()"><mat-icon>search</mat-icon><ng-container i18n>Search</ng-container></button>
    </form>

    @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
    @if (failure()) {
      <p class="m-0 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900" role="alert"><mat-icon class="!h-5 !w-5 shrink-0 !text-xl !leading-none text-red-600">error</mat-icon>{{ failure() }}</p>
    }

    @if (result(); as r) {
      <p class="m-0 mb-3 text-sm text-on-surface-variant">{{ r.hotel.name }} · {{ r.checkIn | date: 'EEE d MMM' }} – {{ r.checkOut | date: 'EEE d MMM y' }} · {{ r.nights }} <ng-container i18n>nights</ng-container> · {{ r.adults }} <ng-container i18n>adult(s)</ng-container></p>
      @if (r.offers.length === 0 && r.unavailable.length === 0) {
        <div class="flex flex-col items-center gap-2 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-10 text-center">
          <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-on-surface-variant">bed</mat-icon>
          <p class="m-0 font-medium" i18n>No rooms are offered to you for these dates.</p>
          <p class="m-0 max-w-md text-sm text-on-surface-variant" i18n>Try other dates, or ask the hotel whether your agreement covers them.</p>
        </div>
      }
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2" [class.pb-24]="cartRooms() > 0">
        @for (o of r.offers; track keyOf(o)) {
          <article class="flex flex-col overflow-hidden rounded-3xl border bg-surface-container-lowest sm:flex-row" [class]="qty(o) > 0 ? 'border-primary' : 'border-outline-variant/60'">
            @if (o.roomType.photos[0]; as photo) { <img [src]="photo" alt="" class="h-44 w-full object-cover sm:h-auto sm:w-44" loading="lazy" /> }
            @else { <div class="flex h-32 w-full items-center justify-center bg-surface-container sm:h-auto sm:w-44"><mat-icon class="!h-10 !w-10 !text-4xl !leading-none text-on-surface-variant">bed</mat-icon></div> }
            <div class="flex flex-1 flex-col gap-2 p-4">
              <div>
                <h2 class="m-0 text-lg font-semibold">{{ o.roomType.name }}@if (o.ratePlan?.name) { <span class="font-normal text-on-surface-variant"> · {{ o.ratePlan!.name }}</span> }</h2>
                <p class="m-0 text-sm text-on-surface-variant"><ng-container i18n>Sleeps up to</ng-container> {{ o.roomType.maxOccupancy }}@if (o.roomType.bedConfiguration) { · {{ o.roomType.bedConfiguration }} }</p>
              </div>
              @if (o.roomType.amenities.length) { <div class="flex flex-wrap gap-1">@for (a of o.roomType.amenities.slice(0, 5); track a) { <span class="rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">{{ a }}</span> }</div> }
              <details class="text-sm"><summary class="cursor-pointer text-on-surface-variant" i18n>Nightly rates</summary>
                <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1">@for (n of o.nights; track n.date) { <span class="tabular-nums">{{ n.date | date: 'd MMM' }}: {{ n.rate | currency: o.currency : 'symbol' : '1.0-2' }}</span> }</div>
              </details>
              <div class="mt-auto flex flex-wrap items-end justify-between gap-2 pt-1">
                <div>
                  <div class="text-xl font-semibold tabular-nums">{{ o.total | currency: o.currency : 'symbol' : '1.0-2' }}</div>
                  <div class="text-xs text-on-surface-variant" i18n>per room, {{ o.nights.length }} nights · {{ o.available }}{{ o.available >= 9 ? '+' : '' }} left</div>
                </div>
                @if (qty(o) === 0) {
                  <button matButton="outlined" type="button" (click)="setQty(o, 1)"><mat-icon>add</mat-icon><ng-container i18n>Add room</ng-container></button>
                } @else {
                  <div class="flex items-center gap-1" role="group" aria-label="Rooms">
                    <button matIconButton type="button" (click)="setQty(o, qty(o) - 1)" aria-label="Fewer rooms" i18n-aria-label><mat-icon>remove</mat-icon></button>
                    <span class="min-w-8 text-center text-lg font-semibold tabular-nums">{{ qty(o) }}</span>
                    <button matIconButton type="button" [disabled]="qty(o) >= o.available" (click)="setQty(o, qty(o) + 1)" aria-label="More rooms" i18n-aria-label><mat-icon>add</mat-icon></button>
                  </div>
                }
              </div>
            </div>
          </article>
        }
      </div>
      @if (r.unavailable.length) {
        <h2 class="m-0 mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-on-surface-variant" i18n>Not available</h2>
        <ul class="m-0 flex list-none flex-col gap-2 p-0">
          @for (u of r.unavailable; track u.roomType._id + (u.ratePlan?._id ?? '')) {
            <li class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 text-sm"><span class="font-medium">{{ u.roomType.name }}@if (u.ratePlan?.name) { · {{ u.ratePlan!.name }} }</span><span class="text-on-surface-variant">{{ reason(u) }}</span></li>
          }
        </ul>
      }
    } @else if (!loading() && !failure()) {
      <div class="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-outline-variant p-10 text-center text-on-surface-variant">
        <mat-icon class="!h-12 !w-12 !text-5xl !leading-none">travel_explore</mat-icon>
        <p class="m-0" i18n>Choose your dates to see the rooms and rates available to you.</p>
      </div>
    }

    @if (cartRooms() > 0) {
      <div class="fixed inset-x-0 bottom-0 z-20 border-t border-outline-variant/60 bg-surface-container-lowest shadow-lg">
        <div class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <div class="font-semibold">{{ cartRooms() }} <ng-container i18n>room(s)</ng-container> · <span class="tabular-nums">{{ cartTotal() | currency: cartCurrency() : 'symbol' : '1.0-2' }}</span></div>
            <div class="text-xs" [class]="cartSleeps() < adults() ? 'text-amber-800' : 'text-on-surface-variant'">
              @if (cartSleeps() < adults()) { <ng-container i18n>These rooms sleep fewer guests than you searched for. Add rooms or change the guests.</ng-container> } @else { {{ cartSummary() }} }
            </div>
          </div>
          <div class="flex gap-2">
            <button matButton type="button" (click)="clearCart()" i18n>Clear</button>
            <button matButton="filled" type="button" (click)="request()" i18n>Request to book</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PartnerSearchComponent {
  private readonly api = inject(PartnerPortalApiService);
  private readonly ctx = inject(PartnerPortalContext);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  readonly today = todayLocal();
  readonly minDate = dateOf(todayLocal());
  readonly form = this.fb.nonNullable.group({
    period: this.fb.group({ start: [dateOf(addDays(todayLocal(), 7)) as Date | null, Validators.required], end: [dateOf(addDays(todayLocal(), 10)) as Date | null, Validators.required] }),
    adults: [2, [Validators.required, Validators.min(1)]],
  });
  readonly query = signal<{ storeId: string; checkIn: string; checkOut: string; adults: number } | null>(null);
  readonly adults = computed(() => this.query()?.adults ?? 1);

  private readonly res = rxResource({
    params: () => this.query(),
    stream: ({ params }) => (params ? this.api.availability(params.storeId, params) : of(null)),
  });
  readonly result = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly loading = computed(() => this.res.isLoading());
  readonly failure = computed(() => (this.res.error() ? messageOf(this.res.error(), $localize`We could not check availability. Try again.`) : ''));

  // ---- the rooms chosen so far ----
  private readonly chosen = signal<Record<string, number>>({});
  keyOf = (o: Offer) => `${o.roomType._id}|${o.ratePlan?._id ?? ''}`;
  qty = (o: Offer) => this.chosen()[this.keyOf(o)] ?? 0;
  readonly cart = computed(() => (this.result()?.offers ?? []).map((o) => ({ offer: o, rooms: this.chosen()[this.keyOf(o)] ?? 0 })).filter((l) => l.rooms > 0));
  readonly cartRooms = computed(() => this.cart().reduce((n, l) => n + l.rooms, 0));
  readonly cartTotal = computed(() => Math.round(this.cart().reduce((c, l) => c + Math.round(l.offer.total * 100) * l.rooms, 0)) / 100);
  readonly cartCurrency = computed(() => this.cart()[0]?.offer.currency ?? '');
  readonly cartSleeps = computed(() => this.cart().reduce((n, l) => n + l.rooms * l.offer.roomType.maxOccupancy, 0));
  readonly cartSummary = computed(() => this.cart().map((l) => `${l.rooms} × ${l.offer.roomType.name}`).join(', '));

  setQty(o: Offer, n: number) {
    const v = Math.max(0, Math.min(o.available, MAX_ROOMS, n));
    const total = this.cartRooms() - this.qty(o) + v;
    if (total > MAX_ROOMS) return;
    this.chosen.update((c) => ({ ...c, [this.keyOf(o)]: v }));
  }
  clearCart() { this.chosen.set({}); }

  reason = (u: Unavailable) => REASONS[u.reason]?.(u) ?? u.reason;

  search() {
    this.form.markAllAsTouched();
    const hotel = this.ctx.current();
    const { start, end } = this.form.controls.period.value;
    if (this.form.invalid || !hotel || !start || !end) return;
    const checkIn = ymdOf(start);
    let checkOut = ymdOf(end);
    if (checkOut <= checkIn) checkOut = addDays(checkIn, 1);
    this.chosen.set({});
    this.query.set({ storeId: hotel.storeId, checkIn, checkOut, adults: Number(this.form.controls.adults.value) });
  }

  request() {
    const r = this.result();
    const hotel = this.ctx.current();
    const q = this.query();
    if (!r || !hotel || !q || !this.cartRooms() || this.dialog.getDialogById('booking')) return;
    this.dialog
      .open(PartnerBookingDialogComponent, { id: 'booking', width: '640px', maxWidth: '96vw', data: { storeId: hotel.storeId, hotelName: hotel.hotel.name, lines: this.cart(), checkIn: r.checkIn, checkOut: r.checkOut, adults: q.adults } })
      .afterClosed()
      .subscribe(() => { this.chosen.set({}); this.query.set({ ...q }); }); // the rooms left may have changed
  }
}
