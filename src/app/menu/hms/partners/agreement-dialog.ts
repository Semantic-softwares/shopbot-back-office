import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { AgreementInput, CommissionType, PartnerAgreement, PartnerAgreementService, PricingMode } from '../../../shared/services/partner-agreement.service';
import { RateInventoryService } from '../../../shared/services/rate-inventory.service';
import { RoomsService } from '../../../shared/services/rooms.service';
import { ValidationErrorsDialogComponent, ValidationErrorsDialogData } from '../../../shared/components/validation-errors-dialog/validation-errors-dialog.component';

export interface AgreementDialogData {
  storeId: string;
  partnerId: string;
  currency: string;
  agreement?: PartnerAgreement;
}

const ymd = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const toDate = (s?: string): Date | null => (s ? new Date(`${s}T12:00:00`) : null);

/**
 * Create or edit the terms under which a partner books this hotel. Two independent choices: what the guest pays (the public rate,
 * a discount, or contracted rates) and what the hotel owes the partner (a commission). It points at the hotel's own room types
 * and rate plans; it never copies them.
 */
@Component({
  selector: 'app-agreement-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatDatepickerModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title>@if (data.agreement) { <ng-container i18n>Edit agreement</ng-container> } @else { <ng-container i18n>New agreement</ng-container> }</h2>
    <mat-dialog-content class="!pt-2">
      @if (error()) {
        <p id="agreement-error" class="m-0 mb-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900" role="alert"><mat-icon class="!h-5 !w-5 shrink-0 !text-xl !leading-none text-red-600">error</mat-icon>{{ error() }}</p>
      }
      @if (data.agreement) {
        <p class="m-0 mb-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900"><ng-container i18n>Changes apply to bookings made from now on. Reservations already made keep the terms they were booked under.</ng-container></p>
      }
      <form [formGroup]="form" class="grid grid-cols-1 gap-x-4 sm:grid-cols-2" (ngSubmit)="save()" id="agreement-form">
        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label><ng-container i18n>Agreement name</ng-container></mat-label>
          <input matInput formControlName="name" autocomplete="off" required />
          @if (form.controls.name.touched && form.controls.name.invalid) { <mat-error><ng-container i18n>Give the agreement a name.</ng-container></mat-error> }
        </mat-form-field>

        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label><ng-container i18n>Valid from – to</ng-container></mat-label>
          <mat-date-range-input [rangePicker]="picker" formGroupName="period">
            <input matStartDate formControlName="start" placeholder="Start" i18n-placeholder />
            <input matEndDate formControlName="end" placeholder="End" i18n-placeholder />
          </mat-date-range-input>
          <mat-datepicker-toggle matSuffix [for]="picker" />
          <mat-date-range-picker #picker />
          @if (form.controls.period.touched && form.controls.period.invalid) { <mat-error><ng-container i18n>Choose the first and last day the agreement is valid.</ng-container></mat-error> }
          <mat-hint><ng-container i18n>Both days are included. A stay must fall wholly inside these dates.</ng-container></mat-hint>
        </mat-form-field>

        <h3 class="m-0 mb-2 mt-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant sm:col-span-2"><ng-container i18n>What the guest pays</ng-container></h3>
        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label><ng-container i18n>Selling rate</ng-container></mat-label>
          <mat-select formControlName="mode">
            <mat-option value="public"><ng-container i18n>The public rate, unchanged</ng-container></mat-option>
            <mat-option value="percent_discount"><ng-container i18n>A percentage off the public rate</ng-container></mat-option>
            <mat-option value="fixed_amount_off"><ng-container i18n>A fixed amount off each night</ng-container></mat-option>
            <mat-option value="fixed_rate"><ng-container i18n>Contracted rates per room type</ng-container></mat-option>
          </mat-select>
        </mat-form-field>
        @if (mode() === 'percent_discount' || mode() === 'fixed_amount_off') {
          <mat-form-field appearance="outline" class="sm:col-span-2">
            <mat-label>@if (mode() === 'percent_discount') { <ng-container i18n>Discount (%)</ng-container> } @else { <ng-container i18n>Amount off each night</ng-container> }</mat-label>
            <input matInput type="number" min="0" formControlName="value" inputmode="decimal" />
            <mat-hint><ng-container i18n>Follows the public rate night by night.</ng-container></mat-hint>
            @if (form.controls.value.touched && form.controls.value.invalid) { <mat-error>@if (mode() === 'percent_discount') { <ng-container i18n>Enter a percentage above 0 and up to 100.</ng-container> } @else { <ng-container i18n>Enter an amount above 0.</ng-container> }</mat-error> }
          </mat-form-field>
        }
        @if (mode() === 'fixed_rate') {
          <div class="flex flex-col gap-2 sm:col-span-2" formArrayName="fixedRates">
            <p class="m-0 text-sm text-on-surface-variant"><ng-container i18n>A contracted rate stays the same even if the public rate changes. Leave the dates empty to use it for the whole agreement.</ng-container></p>
            @for (row of fixedRates.controls; track $index; let i = $index) {
              <div class="grid grid-cols-2 items-start gap-x-3 rounded-2xl border border-outline-variant/60 p-3 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto]" [formGroupName]="i">
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="col-span-2 sm:col-span-1">
                  <mat-label><ng-container i18n>Room type</ng-container></mat-label>
                  <mat-select formControlName="roomType">@for (t of roomTypes(); track t._id) { <mat-option [value]="t._id">{{ t.name }}</mat-option> }</mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label><ng-container i18n>Rate per night</ng-container></mat-label>
                  <input matInput type="number" min="0" formControlName="rate" inputmode="decimal" />
                </mat-form-field>
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label><ng-container i18n>From</ng-container></mat-label>
                  <input matInput [matDatepicker]="from" formControlName="from" />
                  <mat-datepicker-toggle matSuffix [for]="from" /><mat-datepicker #from />
                </mat-form-field>
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label><ng-container i18n>To</ng-container></mat-label>
                  <input matInput [matDatepicker]="to" formControlName="to" />
                  <mat-datepicker-toggle matSuffix [for]="to" /><mat-datepicker #to />
                </mat-form-field>
                <button matIconButton type="button" (click)="removeRate(i)" aria-label="Remove this rate" i18n-aria-label><mat-icon>delete</mat-icon></button>
              </div>
            }
            <button matButton type="button" class="self-start" (click)="addRate()"><mat-icon>add</mat-icon><ng-container i18n>Add a contracted rate</ng-container></button>
          </div>
        }

        <h3 class="m-0 mb-1 mt-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant sm:col-span-2"><ng-container i18n>What the hotel owes</ng-container></h3>
        <div class="flex flex-col gap-1 sm:col-span-2">
          <mat-slide-toggle formControlName="commissionOn"><ng-container i18n>Pays the partner a commission</ng-container></mat-slide-toggle>
          <p class="m-0 text-xs text-on-surface-variant"><ng-container i18n>Commission is worked out on room revenue after discounts and before taxes and fees. It never changes what the guest pays.</ng-container></p>
        </div>
        @if (form.controls.commissionOn.value) {
          <mat-form-field appearance="outline" class="mt-3">
            <mat-label><ng-container i18n>Commission is</ng-container></mat-label>
            <mat-select formControlName="commissionType">
              <mat-option value="percent"><ng-container i18n>A percentage of room revenue</ng-container></mat-option>
              <mat-option value="fixed_per_room_night"><ng-container i18n>A fixed amount per room night</ng-container></mat-option>
              <mat-option value="fixed_per_stay"><ng-container i18n>A fixed amount per stay</ng-container></mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="mt-3">
            <mat-label>@if (form.controls.commissionType.value === 'percent') { <ng-container i18n>Commission (%)</ng-container> } @else { <ng-container i18n>Amount</ng-container> }</mat-label>
            <input matInput type="number" min="0" formControlName="commissionValue" inputmode="decimal" />
            @if (form.controls.commissionValue.touched && form.controls.commissionValue.invalid) { <mat-error>@if (form.controls.commissionType.value === 'percent') { <ng-container i18n>Enter a percentage above 0 and up to 100.</ng-container> } @else { <ng-container i18n>Enter an amount above 0.</ng-container> }</mat-error> }
          </mat-form-field>
          @if (mode() !== 'public') {
            <div class="flex flex-col sm:col-span-2">
              <mat-checkbox formControlName="allowBoth"><ng-container i18n>Allow this negotiated rate and the commission to apply together</ng-container></mat-checkbox>
              @if (form.controls.allowBoth.touched && form.controls.allowBoth.invalid) { <p class="m-0 ml-3 text-xs text-red-700" role="alert"><ng-container i18n>You chose a negotiated rate and a commission. Tick this box to allow both, or turn one of them off.</ng-container></p> }
            </div>
          }
        }

        <h3 class="m-0 mb-2 mt-3 text-sm font-semibold uppercase tracking-wide text-on-surface-variant sm:col-span-2"><ng-container i18n>Which rooms</ng-container></h3>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>Room types</ng-container></mat-label>
          <mat-select formControlName="roomTypes" multiple>@for (t of roomTypes(); track t._id) { <mat-option [value]="t._id">{{ t.name }}</mat-option> }</mat-select>
          <mat-hint><ng-container i18n>Leave empty for every room type</ng-container></mat-hint>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>Rate plans</ng-container></mat-label>
          <mat-select formControlName="ratePlans" multiple>@for (p of ratePlans(); track p._id) { <mat-option [value]="p._id">{{ p.name }}</mat-option> }</mat-select>
          <mat-hint><ng-container i18n>Leave empty for every rate plan</ng-container></mat-hint>
        </mat-form-field>
        <mat-form-field appearance="outline" class="mt-3 sm:col-span-2">
          <mat-label><ng-container i18n>Internal notes</ng-container></mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!px-6 !pb-4">
      <button matButton mat-dialog-close [disabled]="saving()"><ng-container i18n>Cancel</ng-container></button>
      <button matButton="filled" type="submit" form="agreement-form" [disabled]="saving()">
        @if (saving()) { <mat-spinner diameter="18" /> } @else { <ng-container i18n>Save agreement</ng-container> }
      </button>
    </mat-dialog-actions>
  `,
})
export class AgreementDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PartnerAgreementService);
  private readonly rooms = inject(RoomsService);
  private readonly rateApi = inject(RateInventoryService);
  private readonly dialog = inject(MatDialog);
  private readonly ref = inject<MatDialogRef<AgreementDialogComponent, PartnerAgreement>>(MatDialogRef);
  readonly data = inject<AgreementDialogData>(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  readonly error = signal('');

  private readonly typesRes = rxResource({ params: () => this.data.storeId, stream: ({ params }) => (params ? this.rooms.getRoomTypes(params) : of([])) });
  readonly roomTypes = computed(() => (this.typesRes.hasValue() ? (this.typesRes.value() as Array<{ _id: string; name: string }>) : []));
  private readonly plansRes = rxResource({ params: () => this.data.storeId, stream: ({ params }) => (params ? this.rateApi.getRatePlans(params) : of([])) });
  readonly ratePlans = computed(() => (this.plansRes.hasValue() ? (this.plansRes.value() as Array<{ _id: string; name: string }>) : []));

  private readonly a = this.data.agreement;
  readonly form = this.fb.group({
    name: [this.a?.name ?? '', [Validators.required, Validators.minLength(2)]],
    period: this.fb.group({ start: [toDate(this.a?.startDate), Validators.required], end: [toDate(this.a?.endDate), Validators.required] }, { validators: [(g: AbstractControl): ValidationErrors | null => { const { start, end } = g.value ?? {}; return start && end && end < start ? { order: true } : null; }] }),
    mode: [(this.a?.pricing.mode ?? 'public') as PricingMode],
    value: [this.a?.pricing.value ?? (null as number | null)],
    fixedRates: this.fb.array((this.a?.pricing.fixedRates ?? []).map((r) => this.rateRow(r))),
    commissionOn: [this.a ? !!this.a.commission.enabled : true],
    commissionType: [(this.a?.commission.type ?? 'percent') as CommissionType],
    commissionValue: [this.a?.commission.value ?? (null as number | null)],
    allowBoth: [!!this.a?.allowBoth, [(c: AbstractControl): ValidationErrors | null => { const g = c.parent as FormGroup | null; return g && g.get('mode')?.value !== 'public' && g.get('commissionOn')?.value && !c.value ? { both: true } : null; }]],
    roomTypes: [(this.a?.roomTypes ?? []).map((x: any) => String(x?._id ?? x))],
    ratePlans: [(this.a?.ratePlans ?? []).map((x: any) => String(x?._id ?? x))],
    notes: [this.a?.notes ?? ''],
  });
  readonly mode = toSignal(this.form.controls.mode.valueChanges, { initialValue: this.form.controls.mode.value });

  constructor() {
    // What each value must be depends on the choices above it, so the rules follow those choices.
    const apply = () => {
      const f = this.form.controls;
      const percent = f.mode.value === 'percent_discount';
      f.value.setValidators(f.mode.value === 'percent_discount' || f.mode.value === 'fixed_amount_off' ? [Validators.required, Validators.min(0.01), ...(percent ? [Validators.max(100)] : [])] : []);
      const commissionPercent = f.commissionType.value === 'percent';
      f.commissionValue.setValidators(f.commissionOn.value ? [Validators.required, Validators.min(0.01), ...(commissionPercent ? [Validators.max(100)] : [])] : []);
      f.fixedRates.setValidators(f.mode.value === 'fixed_rate' ? [(a: AbstractControl): ValidationErrors | null => ((a as FormArray).length ? null : { none: true })] : []);
      for (const c of [f.value, f.commissionValue, f.fixedRates, f.allowBoth]) c.updateValueAndValidity({ emitEvent: false });
    };
    apply();
    const f = this.form.controls;
    f.mode.valueChanges.subscribe(apply);
    f.commissionOn.valueChanges.subscribe(apply);
    f.commissionType.valueChanges.subscribe(apply);
    f.allowBoth.valueChanges.subscribe(apply);
  }

  get fixedRates(): FormArray { return this.form.controls.fixedRates; }

  private rateRow(r?: { roomType: string; rate: number; from?: string; to?: string }) {
    return this.fb.group({ roomType: [String((r?.roomType as any)?._id ?? r?.roomType ?? ''), Validators.required], rate: [r?.rate ?? (null as number | null), [Validators.required, Validators.min(0.01)]], from: [toDate(r?.from)], to: [toDate(r?.to)] });
  }
  addRate() { this.fixedRates.push(this.rateRow()); }
  removeRate(i: number) { this.fixedRates.removeAt(i); }

  save() {
    this.form.markAllAsTouched();
    if (this.saving()) return;
    if (this.form.invalid) { this.showProblems(); return; }
    const v = this.form.getRawValue();
    const pricing = v.mode === 'public' ? { mode: v.mode } : v.mode === 'fixed_rate'
      ? { mode: v.mode, fixedRates: v.fixedRates.map((r: any) => ({ roomType: r.roomType, rate: Number(r.rate), from: r.from ? ymd(r.from) : undefined, to: r.to ? ymd(r.to) : undefined })) }
      : { mode: v.mode, value: Number(v.value) };
    const input: AgreementInput = {
      name: v.name!.trim(), pricing: pricing as any,
      commission: v.commissionOn ? { enabled: true, type: v.commissionType!, value: Number(v.commissionValue) } : { enabled: false },
      allowBoth: !!v.allowBoth && v.mode !== 'public' && !!v.commissionOn,
      startDate: ymd(v.period.start as Date), endDate: ymd(v.period.end as Date),
      roomTypes: v.roomTypes ?? [], ratePlans: v.ratePlans ?? [], notes: v.notes ?? '',
    };
    this.saving.set(true);
    this.error.set('');
    const call = this.a ? this.api.update(this.data.storeId, this.a._id, input) : this.api.create(this.data.storeId, this.data.partnerId, input);
    call.subscribe({
      next: (saved) => this.ref.close(saved),
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.message ?? $localize`Could not save the agreement. Try again.`);
        // The message sits at the top of the form; the person may have scrolled down to the button.
        setTimeout(() => document.getElementById('agreement-error')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
      },
    });
  }

  /** Say, in plain words, what still needs fixing, in the same dialog the other forms use. */
  private showProblems() {
    const labels: NonNullable<ValidationErrorsDialogData['labels']> = {};
    const paths: string[] = [];
    const add = (path: string, title: string, detail?: string) => { paths.push(path); labels[path] = { title, detail }; };
    const f = this.form.controls;
    if (f.name.invalid) add('name', $localize`Agreement name`, $localize`Give the agreement a name of at least two letters.`);
    if (f.period.controls.start.invalid) add('period.start', $localize`Start date`, $localize`Choose the first day the agreement is valid.`);
    if (f.period.controls.end.invalid) add('period.end', $localize`End date`, $localize`Choose the last day the agreement is valid.`);
    if (!f.period.controls.start.invalid && !f.period.controls.end.invalid && f.period.invalid) add('period', $localize`Dates`, $localize`The end date cannot be before the start date.`);
    if (f.value.invalid) add('value', f.mode.value === 'percent_discount' ? $localize`Discount (%)` : $localize`Amount off each night`, f.mode.value === 'percent_discount' ? $localize`Enter a percentage above 0 and up to 100.` : $localize`Enter an amount above 0.`);
    if (f.fixedRates.errors?.['none']) add('fixedRates', $localize`Contracted rates`, $localize`Add at least one contracted rate, or choose a different selling rate.`);
    this.fixedRates.controls.forEach((row, i) => {
      const g = row as FormGroup;
      if (g.get('roomType')?.invalid) add(`fixedRates.${i}.roomType`, $localize`Room type for contracted rate ${i + 1}`, $localize`Choose the room type this rate is for.`);
      if (g.get('rate')?.invalid) add(`fixedRates.${i}.rate`, $localize`Rate per night for contracted rate ${i + 1}`, $localize`Enter a rate above 0.`);
    });
    if (f.commissionValue.invalid) add('commissionValue', f.commissionType.value === 'percent' ? $localize`Commission (%)` : $localize`Commission amount`, f.commissionType.value === 'percent' ? $localize`Enter a percentage above 0 and up to 100.` : $localize`Enter an amount above 0.`);
    if (f.allowBoth.invalid) add('allowBoth', $localize`Negotiated rate and commission together`, $localize`Tick the “allow both” box, or turn one of them off.`);
    this.dialog.open(ValidationErrorsDialogComponent, {
      data: { invalidControls: paths, labels, title: $localize`Form Validation Errors`, message: $localize`Please fix the following errors before submitting:` } as ValidationErrorsDialogData,
      width: '500px',
      maxWidth: '90vw',
    });
  }
}
