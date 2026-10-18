import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Offer, PartnerPortalApiService, Unavailable, messageOf } from './partner-portal-api.service';
import { PartnerPortalContext } from './partner-portal-context.service';
import { PartnerBookingDialogComponent } from './partner-booking-dialog';

const addDays = (day: string, n: number) => new Date(Date.parse(day + 'T00:00:00Z') + n * 86_400_000).toISOString().slice(0, 10);
const todayLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

const REASONS: Record<string, (u: Unavailable) => string> = {
  SOLD_OUT: (u) => (u.available ? $localize`Only ${u.available} left, not enough for the number of rooms you asked for` : $localize`Sold out for these dates`),
  STOP_SELL: () => $localize`Not on sale for these dates`,
  CLOSED_TO_ARRIVAL: () => $localize`Arrival is not possible on this day`,
  CLOSED_TO_DEPARTURE: () => $localize`Departure is not possible on this day`,
  MIN_STAY: (u) => $localize`Minimum stay is ${u.minStay} nights`,
  MAX_STAY: (u) => $localize`Maximum stay is ${u.minStay} nights`,
};

/** Find rooms at the partner's own agreed rates for a stay, then ask the hotel for one. */
@Component({
  selector: 'app-partner-search',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h1 class="m-0 mb-4 text-2xl font-semibold" i18n>Find rooms</h1>
    <form [formGroup]="form" (ngSubmit)="search()" class="mb-5 grid grid-cols-2 gap-x-3 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-4 pb-1 md:grid-cols-[1fr_1fr_8rem_8rem_auto] md:items-start">
      <mat-form-field appearance="outline"><mat-label i18n>Check-in</mat-label><input matInput type="date" formControlName="checkIn" [min]="today" (change)="syncOut()" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label i18n>Check-out</mat-label><input matInput type="date" formControlName="checkOut" [min]="minOut()" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label i18n>Adults</mat-label><input matInput type="number" min="1" max="40" formControlName="adults" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label i18n>Rooms</mat-label><input matInput type="number" min="1" max="5" formControlName="rooms" /></mat-form-field>
      <button matButton="filled" type="submit" class="col-span-2 !h-14 md:col-span-1" [disabled]="loading()"><mat-icon>search</mat-icon><ng-container i18n>Search</ng-container></button>
    </form>

    @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
    @if (failure()) {
      <p class="m-0 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900" role="alert"><mat-icon class="!h-5 !w-5 !text-xl !leading-none text-red-600">error</mat-icon>{{ failure() }}</p>
    }

    @if (result(); as r) {
      <p class="m-0 mb-3 text-sm text-on-surface-variant">{{ r.hotel.name }} · {{ r.checkIn | date: 'EEE d MMM' }} – {{ r.checkOut | date: 'EEE d MMM y' }} · {{ r.nights }} <ng-container i18n>nights</ng-container> · {{ r.rooms }} <ng-container i18n>room(s)</ng-container> · {{ r.adults }} <ng-container i18n>adult(s)</ng-container></p>
      @if (r.offers.length === 0 && r.unavailable.length === 0) {
        <div class="flex flex-col items-center gap-2 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-10 text-center">
          <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-on-surface-variant">bed</mat-icon>
          <p class="m-0 font-medium" i18n>No rooms are offered to you for these dates.</p>
          <p class="m-0 max-w-md text-sm text-on-surface-variant" i18n>Try other dates, or ask the hotel whether your agreement covers them.</p>
        </div>
      }
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        @for (o of r.offers; track o.roomType._id + (o.ratePlan?._id ?? '')) {
          <article class="flex flex-col overflow-hidden rounded-3xl border border-outline-variant/60 bg-surface-container-lowest sm:flex-row">
            @if (o.roomType.photos[0]; as photo) { <img [src]="photo" alt="" class="h-44 w-full object-cover sm:h-auto sm:w-44" loading="lazy" /> }
            @else { <div class="flex h-32 w-full items-center justify-center bg-surface-container sm:h-auto sm:w-44"><mat-icon class="!h-10 !w-10 !text-4xl !leading-none text-on-surface-variant">bed</mat-icon></div> }
            <div class="flex flex-1 flex-col gap-2 p-4">
              <div>
                <h2 class="m-0 text-lg font-semibold">{{ o.roomType.name }}@if (o.ratePlan?.name) { <span class="font-normal text-on-surface-variant"> · {{ o.ratePlan!.name }}</span> }</h2>
                <p class="m-0 text-sm text-on-surface-variant"><ng-container i18n>Sleeps up to</ng-container> {{ o.roomType.maxOccupancy }}@if (o.roomType.bedConfiguration) { · {{ o.roomType.bedConfiguration }} }</p>
              </div>
              @if (o.roomType.amenities.length) { <div class="flex flex-wrap gap-1">@for (a of o.roomType.amenities.slice(0, 5); track a) { <span class="rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">{{ a }}</span> }</div> }
              @if (!o.fitsGuests) { <p class="m-0 text-xs text-amber-800" i18n>Too small for this many guests in the rooms requested. Add rooms or pick a larger room.</p> }
              <details class="text-sm"><summary class="cursor-pointer text-on-surface-variant" i18n>Nightly rates</summary>
                <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1">@for (n of o.nights; track n.date) { <span class="tabular-nums">{{ n.date | date: 'd MMM' }}: {{ n.rate | currency: o.currency : 'symbol' : '1.0-2' }}</span> }</div>
              </details>
              <div class="mt-auto flex flex-wrap items-end justify-between gap-2 pt-1">
                <div>
                  <div class="text-xl font-semibold tabular-nums">{{ o.total * r.rooms | currency: o.currency : 'symbol' : '1.0-2' }}</div>
                  <div class="text-xs text-on-surface-variant">{{ o.nights.length }} <ng-container i18n>nights</ng-container>@if (r.rooms > 1) { · {{ o.total | currency: o.currency : 'symbol' : '1.0-2' }} <ng-container i18n>per room</ng-container> } · {{ o.available }}@if (o.available >= 9) { + }&nbsp;<ng-container i18n>left</ng-container></div>
                </div>
                <button matButton="filled" type="button" (click)="request(o)" i18n>Request to book</button>
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
  `,
})
export class PartnerSearchComponent {
  private readonly api = inject(PartnerPortalApiService);
  private readonly ctx = inject(PartnerPortalContext);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  readonly today = todayLocal();
  readonly form = this.fb.nonNullable.group({
    checkIn: [addDays(todayLocal(), 7), Validators.required],
    checkOut: [addDays(todayLocal(), 10), Validators.required],
    adults: [2, [Validators.required, Validators.min(1)]],
    rooms: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
  });
  readonly minOut = computed(() => addDays(this.query()?.checkIn ?? this.form.controls.checkIn.value ?? this.today, 1));
  readonly query = signal<{ storeId: string; checkIn: string; checkOut: string; adults: number; rooms: number } | null>(null);

  private readonly res = rxResource({
    params: () => this.query(),
    stream: ({ params }) => (params ? this.api.availability(params.storeId, params) : of(null)),
  });
  readonly result = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly loading = computed(() => this.res.isLoading());
  readonly failure = computed(() => (this.res.error() ? messageOf(this.res.error(), $localize`We could not check availability. Try again.`) : ''));

  reason = (u: Unavailable) => REASONS[u.reason]?.(u) ?? u.reason;
  syncOut() {
    const c = this.form.controls;
    if (c.checkOut.value <= c.checkIn.value) c.checkOut.setValue(addDays(c.checkIn.value, 1));
  }

  search() {
    this.form.markAllAsTouched();
    const hotel = this.ctx.current();
    if (this.form.invalid || !hotel) return;
    const v = this.form.getRawValue();
    this.query.set({ storeId: hotel.storeId, checkIn: v.checkIn, checkOut: v.checkOut, adults: Number(v.adults), rooms: Number(v.rooms) });
  }

  request(offer: Offer) {
    const r = this.result();
    const hotel = this.ctx.current();
    const q = this.query();
    if (!r || !hotel || !q || this.dialog.getDialogById('booking')) return;
    this.dialog.open(PartnerBookingDialogComponent, { id: 'booking', width: '640px', maxWidth: '96vw', data: { storeId: hotel.storeId, hotelName: hotel.hotel.name, offer, checkIn: r.checkIn, checkOut: r.checkOut, rooms: r.rooms, adults: r.adults } })
      .afterClosed().subscribe(() => this.query.set({ ...q })); // the rooms left may have changed
  }
}
