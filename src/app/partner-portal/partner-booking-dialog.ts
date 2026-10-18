import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Offer, PartnerPortalApiService, PortalRequest, messageOf, newKey } from './partner-portal-api.service';

export interface BookingLine { offer: Offer; rooms: number }
export interface BookingDialogData {
  storeId: string;
  hotelName: string;
  lines: BookingLine[];
  checkIn: string;
  checkOut: string;
  adults: number;
}

/**
 * Asking the hotel for rooms: one or several kinds, in one request. The price shown is the server's own; the browser sends the total
 * back only so the server can say if it has changed since. A request is not a booking: the hotel confirms it, and nothing is held.
 */
@Component({
  selector: 'app-partner-booking-dialog',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (!sent()) {
      <h2 mat-dialog-title i18n>Request to book</h2>
      <mat-dialog-content>
        <div class="mb-4 flex flex-col gap-1 rounded-2xl bg-surface-container p-4 text-sm">
          @for (l of lines(); track l.offer.roomType._id + (l.offer.ratePlan?._id ?? '')) {
            <div class="flex flex-wrap justify-between gap-2"><span class="font-semibold">{{ l.rooms }} × {{ l.offer.roomType.name }}</span><span class="tabular-nums">{{ l.offer.total * l.rooms | currency: l.offer.currency : 'symbol' : '1.0-2' }}</span></div>
          }
          <div class="text-on-surface-variant">{{ data.hotelName }} · {{ data.checkIn | date: 'EEE d MMM' }} – {{ data.checkOut | date: 'EEE d MMM y' }} · {{ nights() }} <ng-container i18n>nights</ng-container></div>
          <div class="mt-1 flex items-baseline justify-between"><span class="text-xs uppercase tracking-wide text-on-surface-variant" i18n>Total</span><span class="text-xl font-semibold tabular-nums">{{ total() | currency: currency() : 'symbol' : '1.0-2' }}</span></div>
        </div>
        @if (changed()) {
          <p class="m-0 mb-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="alert"><mat-icon class="!h-5 !w-5 shrink-0 !text-xl !leading-none">price_change</mat-icon><ng-container i18n>The price for this stay has changed. Check the new price above, then send the request again.</ng-container></p>
        }
        <form [formGroup]="form" id="booking-form" (ngSubmit)="send()" class="grid grid-cols-1 gap-x-3 sm:grid-cols-2" novalidate>
          <h3 class="m-0 mb-2 text-sm font-semibold sm:col-span-2" i18n>Lead guest</h3>
          <mat-form-field appearance="outline"><mat-label i18n>First name</mat-label><input matInput formControlName="firstName" autocomplete="off" />@if (form.controls.firstName.touched && form.controls.firstName.invalid) { <mat-error i18n>Required</mat-error> }</mat-form-field>
          <mat-form-field appearance="outline"><mat-label i18n>Last name</mat-label><input matInput formControlName="lastName" autocomplete="off" />@if (form.controls.lastName.touched && form.controls.lastName.invalid) { <mat-error i18n>Required</mat-error> }</mat-form-field>
          <mat-form-field appearance="outline"><mat-label i18n>Email (optional)</mat-label><input matInput type="email" formControlName="email" autocomplete="off" inputmode="email" />@if (form.controls.email.invalid) { <mat-error i18n>Enter a valid email address.</mat-error> }</mat-form-field>
          <mat-form-field appearance="outline"><mat-label i18n>Phone (optional)</mat-label><input matInput formControlName="phone" autocomplete="off" inputmode="tel" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label i18n>Nationality (optional)</mat-label><input matInput formControlName="nationality" autocomplete="off" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label i18n>Your reference (optional)</mat-label><input matInput formControlName="partnerReference" autocomplete="off" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label i18n>Adults</mat-label><input matInput type="number" min="1" formControlName="adults" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label i18n>Children</mat-label><input matInput type="number" min="0" formControlName="children" /></mat-form-field>
          <mat-form-field appearance="outline" class="sm:col-span-2"><mat-label i18n>Notes for the hotel (optional)</mat-label><textarea matInput rows="3" formControlName="notes" maxlength="1000"></textarea></mat-form-field>
        </form>
        <p class="m-0 text-xs text-on-surface-variant" i18n>This is a request, not a confirmed booking. The hotel will confirm or decline it, and no room is held until then.</p>
        @if (error()) { <p class="m-0 mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900" role="alert"><mat-icon class="!h-5 !w-5 shrink-0 !text-xl !leading-none text-red-600">error</mat-icon>{{ error() }}</p> }
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="!px-6 !pb-4">
        <button matButton mat-dialog-close i18n>Cancel</button>
        <button matButton="filled" type="submit" form="booking-form" [disabled]="busy()">@if (busy()) { <mat-spinner diameter="18" /> } @else { <ng-container i18n>Send request</ng-container> }</button>
      </mat-dialog-actions>
    } @else {
      <h2 mat-dialog-title class="!flex !items-center !gap-2"><mat-icon class="text-green-700">check_circle</mat-icon><ng-container i18n>Request sent</ng-container></h2>
      <mat-dialog-content>
        <p class="m-0 mb-2" i18n>The hotel has your request and will confirm or decline it. We will email you either way.</p>
        <p class="m-0 text-sm text-on-surface-variant"><ng-container i18n>Reference</ng-container> <strong class="text-on-surface">{{ sent()!.code }}</strong></p>
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="!px-6 !pb-4">
        <button matButton mat-dialog-close i18n>Close</button>
        <button matButton="filled" (click)="goToRequests()" i18n>See my requests</button>
      </mat-dialog-actions>
    }
  `,
})
export class PartnerBookingDialogComponent {
  private readonly api = inject(PartnerPortalApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ref = inject<MatDialogRef<PartnerBookingDialogComponent>>(MatDialogRef);
  readonly data = inject<BookingDialogData>(MAT_DIALOG_DATA);
  /** One key for this dialog: pressing Send twice, or retrying after a dropped connection, is still one request. */
  private readonly key = newKey();

  readonly lines = signal<BookingLine[]>(this.data.lines);
  readonly total = computed(() => Math.round(this.lines().reduce((c, l) => c + Math.round(l.offer.total * 100) * l.rooms, 0)) / 100);
  readonly currency = computed(() => this.lines()[0]?.offer.currency ?? '');
  readonly nights = computed(() => this.lines()[0]?.offer.nights.length ?? 0);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly changed = signal(false);
  readonly sent = signal<PortalRequest | null>(null);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', Validators.email],
    phone: [''],
    nationality: [''],
    partnerReference: [''],
    adults: [this.data.adults, [Validators.required, Validators.min(1)]],
    children: [0, [Validators.min(0)]],
    notes: [''],
  });

  send() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    const v = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.api
      .submit(this.data.storeId, {
        idempotencyKey: this.key,
        lines: this.lines().map((l) => ({ roomTypeId: l.offer.roomType._id, ratePlanId: l.offer.ratePlan?._id ?? null, rooms: l.rooms })),
        checkIn: this.data.checkIn,
        checkOut: this.data.checkOut,
        adults: Number(v.adults),
        children: Number(v.children) || 0,
        quotedTotal: this.total(),
        guest: { firstName: v.firstName.trim(), lastName: v.lastName.trim(), email: v.email.trim() || undefined, phone: v.phone.trim() || undefined, nationality: v.nationality.trim() || undefined },
        partnerReference: v.partnerReference.trim() || undefined,
        notes: v.notes.trim() || undefined,
      })
      .subscribe({
        next: (res) => { this.busy.set(false); this.sent.set(res.request); },
        error: (e) => {
          this.busy.set(false);
          const cur = e?.error?.current;
          if (e?.error?.code === 'PRICE_CHANGED' && cur) {
            this.lines.update((ls) => ls.map((l) => {
              const n = cur.lines?.find((x: any) => x.roomTypeId === l.offer.roomType._id && (x.ratePlanId ?? null) === (l.offer.ratePlan?._id ?? null));
              return n ? { ...l, offer: { ...l.offer, total: n.total, nights: n.nights } } : l;
            }));
            this.changed.set(true);
            this.error.set('');
          } else {
            this.changed.set(false);
            this.error.set(messageOf(e, $localize`The request could not be sent. Try again.`));
          }
        },
      });
  }

  goToRequests() {
    this.ref.close('requests');
    this.router.navigate(['/partner/requests']);
  }
}
