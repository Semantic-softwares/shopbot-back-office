import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, effect, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, map, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Reservation } from '../../../../../../../shared/models/reservation.model';
import { PartnerAgreementService, QuoteResult, commissionSummary, pricingSummary } from '../../../../../../../shared/services/partner-agreement.service';
import { PartnerCommissionService, COMMISSION_STATUS_TONES, commissionStatusLabel } from '../../../../../../../shared/services/partner-commission.service';
import { RolesService } from '../../../../../../../shared/services/roles.service';

const ymd = (v: unknown): string => {
  if (!v) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  const d = v as Date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const idOf = (v: any): string => String(v?._id ?? v ?? '');
const cents = (n: unknown): number => Math.round((Number(n) || 0) * 100);

interface RoomSnap {
  index: number;
  roomTypeId: string;
  ratePlanId: string | null;
  from: string;
  to: string;
  totalPrice: number;
  nights: number;
}

/**
 * What a partner booking is priced at. The server works out the price from the hotel's own rates and the partner's agreement;
 * this card shows it, says whether the form still matches it, and applies it. Commission is shown apart from the price, because it
 * is what the hotel owes the partner, not something the guest pays.
 */
@Component({
  selector: 'app-partner-terms',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './partner-terms.component.html',
})
export class PartnerTermsComponent {
  readonly form = input.required<FormGroup>();
  readonly storeId = input.required<string>();
  readonly reservation = input<Reservation | null | undefined>(null);
  readonly isEditing = input(false);

  private readonly api = inject(PartnerAgreementService);
  private readonly roles = inject(RolesService);
  private readonly commissionsApi = inject(PartnerCommissionService);
  private readonly currencyPipe = new CurrencyPipe(inject(LOCALE_ID));

  readonly partnerId = signal('');
  readonly rooms = signal<RoomSnap[]>([]);
  readonly currency = signal('');
  readonly canOverride = computed(() => this.roles.isAdmin() || this.roles.hasAny(['hotel.partners.override_price']));

  /** The part of the form that decides the price, not the price itself, so editing a price does not trigger a new quote. */
  private readonly requestKey = signal('');
  readonly request = computed(() => {
    const partner = this.partnerId();
    const priced = this.rooms().filter((r) => r.roomTypeId && r.from && r.to);
    return partner && priced.length && this.requestKey() ? { partner, rooms: priced } : null;
  });

  private readonly quoteRes = rxResource({
    params: () => ({ store: this.storeId(), request: this.request() }),
    stream: ({ params }) => {
      const r = params.request;
      if (!params.store || !r) return of(null);
      return this.api
        .quote(params.store, { partnerId: r.partner, rooms: r.rooms.map((x) => ({ roomTypeId: x.roomTypeId, ratePlanId: x.ratePlanId, checkIn: x.from, checkOut: x.to })) })
        .pipe(map((result) => ({ ok: true as const, result })), catchError((e) => of({ ok: false as const, message: e?.error?.message ?? $localize`The agreed price could not be worked out right now.`, code: e?.error?.code as string | undefined })));
    },
  });
  private readonly last = computed(() => (this.quoteRes.hasValue() ? this.quoteRes.value() : null));
  readonly loading = computed(() => this.quoteRes.isLoading());
  readonly quote = computed<QuoteResult | null>(() => { const v = this.last(); return v && v.ok ? v.result : null; });
  readonly problem = computed(() => { const v = this.last(); return v && !v.ok ? v : null; });

  constructor() {
    // Follow the form: the partner and the rooms (room type, rate plan, dates, price) change as the person fills it in.
    effect((onCleanup) => {
      const form = this.form();
      const read = () => {
        const raw = form.getRawValue() as any;
        this.partnerId.set(idOf(raw.partner));
        const rooms: RoomSnap[] = ((raw.rooms ?? []) as any[]).map((r, index) => ({
          index, roomTypeId: idOf(r.roomType), ratePlanId: r.ratePlanId && r.ratePlanId !== 'none' ? idOf(r.ratePlanId) : null,
          from: ymd(r.stayPeriod?.from ?? raw.checkInDate), to: ymd(r.stayPeriod?.to ?? raw.checkOutDate),
          totalPrice: Number(r.pricing?.totalPrice) || 0, nights: Number(r.stayPeriod?.numberOfNights) || 0,
        }));
        this.rooms.set(rooms);
        const key = JSON.stringify([raw.partner, rooms.map((r) => [r.roomTypeId, r.ratePlanId, r.from, r.to])]);
        if (key !== this.pendingKey) { this.pendingKey = key; clearTimeout(this.timer); this.timer = setTimeout(() => this.requestKey.set(key), 350); }
      };
      read();
      const sub = form.valueChanges.subscribe(read);
      onCleanup(() => { sub.unsubscribe(); clearTimeout(this.timer); });
    });
  }
  private pendingKey = '';
  private timer: ReturnType<typeof setTimeout> | undefined;

  money = (n: number): string => this.currencyPipe.transform(n, this.currency() || this.quote()?.quotes[0]?.currency || '', 'symbol', '1.0-2') ?? String(n);
  readonly rateText = computed(() => { const a = this.quote()?.agreement; return a ? pricingSummary(a as any, this.money) : ''; });
  readonly commissionText = computed(() => { const a = this.quote()?.agreement; return a ? commissionSummary(a as any, this.money) : ''; });
  readonly estimatedCommission = computed(() => (this.quote()?.quotes ?? []).reduce((s, q) => s + q.estimatedCommission, 0));
  readonly agreedTotal = computed(() => (this.quote()?.quotes ?? []).reduce((s, q) => s + q.agreedTotal, 0));
  readonly publicTotal = computed(() => (this.quote()?.quotes ?? []).reduce((s, q) => s + q.publicTotal, 0));
  readonly noRate = computed(() => (this.quote()?.quotes ?? []).some((q) => q.warnings.includes('NO_PUBLIC_RATE')));

  /** The form's price for each quoted room differs from what the server would charge. */
  readonly differs = computed(() => {
    const q = this.quote();
    if (!q?.agreement) return false;
    return q.quotes.some((x) => cents(this.rooms().find((r) => r.index === x.index)?.totalPrice) !== cents(x.agreedTotal));
  });

  /** Where the commission on this saved booking stands, for people allowed to see commissions. */
  private readonly commissionRes = rxResource({
    params: () => ({ store: this.storeId(), id: this.isEditing() && this.stayUnchanged() ? String(this.reservation()?._id ?? '') : '', ok: this.roles.isAdmin() || this.roles.hasAny(['hotel.commissions.view']) }),
    stream: ({ params }) => (params.store && params.id && params.ok ? this.commissionsApi.list(params.store, { reservation: params.id, limit: 1 }).pipe(map((r) => r.rows[0] ?? null), catchError(() => of(null))) : of(null)),
  });
  readonly commission = computed(() => (this.commissionRes.hasValue() ? this.commissionRes.value() : null));
  commissionTone = (s: string) => COMMISSION_STATUS_TONES[s] ?? 'bg-gray-100 text-gray-700';
  commissionStatusText = commissionStatusLabel;

  /** Terms taken when this booking was made, shown while the stay is unchanged. */
  readonly savedTerms = computed(() => (this.reservation() as any)?.partnerTerms ?? null);
  private shapeKey = (rooms: any[], checkIn: unknown, checkOut: unknown) => JSON.stringify((rooms ?? []).map((r) => [idOf(r.room), idOf(r.roomType), r.ratePlanId ? idOf(r.ratePlanId) : '', ymd(r.stayPeriod?.from ?? checkIn), ymd(r.stayPeriod?.to ?? checkOut)]));
  readonly stayUnchanged = computed(() => {
    const res = this.reservation();
    if (!res || !this.isEditing()) return false;
    const raw = this.form().getRawValue() as any;
    this.rooms(); // re-evaluate as the form changes
    // The saved terms belong to the saved partner and the saved stay: change either and today's agreement is what applies.
    if (idOf(res.partner) !== this.partnerId()) return false;
    return this.shapeKey(res.rooms as any[], res.checkInDate, res.checkOutDate) === this.shapeKey(raw.rooms, raw.checkInDate, raw.checkOutDate);
  });
  readonly showSaved = computed(() => !!this.savedTerms()?.agreement && this.stayUnchanged());
  readonly savedTotal = computed(() => ((this.savedTerms()?.rooms ?? []) as any[]).reduce((s, r) => s + (Number(r.agreedTotal) || 0), 0));
  readonly savedRateText = computed(() => { const t = this.savedTerms(); return t ? pricingSummary({ pricing: { mode: t.pricingMode, value: t.pricingValue, fixedRates: [] } } as any, (n) => this.currencyPipe.transform(n, t.currency || '', 'symbol', '1.0-2') ?? String(n)) : ''; });
  readonly savedCommissionText = computed(() => { const t = this.savedTerms(); return t ? commissionSummary({ commission: t.commissionRule } as any, (n) => this.currencyPipe.transform(n, t.currency || '', 'symbol', '1.0-2') ?? String(n)) : ''; });

  readonly overrideReason = computed(() => String((this.form().get('partnerPriceOverrideReason') as any)?.value ?? ''));
  setReason(value: string) { this.form().get('partnerPriceOverrideReason')?.setValue(value); }

  /** Put the agreed price on every quoted room. The form's own totals follow from the rooms. */
  apply() {
    const q = this.quote();
    const array = this.form().get('rooms') as FormArray | null;
    if (!q || !array) return;
    for (const x of q.quotes) {
      const group = array.at(x.index) as FormGroup | undefined;
      const pricing = group?.get('pricing') as FormGroup | undefined;
      if (!pricing) continue;
      const nights = Math.max(1, x.nights.length);
      const raw = pricing.getRawValue() as any;
      const subtotal = x.agreedTotal;
      const discount = raw.discountType === 'percentage' ? (subtotal * (Number(raw.discount) || 0)) / 100 : Number(raw.discount) || 0;
      const fees = Object.values(raw.fees ?? {}).reduce((s: number, v) => s + (Number(v) || 0), 0);
      pricing.patchValue({ pricePerNight: Math.round((x.agreedTotal / nights) * 100) / 100, totalPrice: x.agreedTotal, subtotal, total: subtotal - discount + (Number(raw.taxes) || 0) + fees });
    }
    this.form().markAsDirty();
    this.setReason('');
  }
}
