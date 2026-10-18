import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { PARTNER_TYPES, PARTNER_TYPE_LABELS, Partner, PartnerService } from '../../../shared/services/partner.service';

export interface PartnerDialogData {
  storeId: string;
  partner?: Partner;
}

/** Create or edit a travel partner's profile: who they are and how to reach them. Commercial terms live in agreements. */
@Component({
  selector: 'app-partner-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title>@if (data.partner) { <ng-container i18n>Edit partner</ng-container> } @else { <ng-container i18n>New partner</ng-container> }</h2>
    <mat-dialog-content class="!pt-2">
      <form [formGroup]="form" class="grid grid-cols-1 gap-x-4 sm:grid-cols-2" (ngSubmit)="save()" id="partner-form">
        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label><ng-container i18n>Partner name</ng-container></mat-label>
          <input matInput formControlName="name" autocomplete="off" required />
          @if (form.controls.name.touched && form.controls.name.invalid) { <mat-error><ng-container i18n>Give the partner a name.</ng-container></mat-error> }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>Type</ng-container></mat-label>
          <mat-select formControlName="type">
            @for (t of types; track t) { <mat-option [value]="t">{{ typeLabel(t) }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>Partner code</ng-container></mat-label>
          <input matInput formControlName="code" autocomplete="off" placeholder="Created for you when left empty" i18n-placeholder />
          <mat-hint><ng-container i18n>Your own reference, unique at this hotel</ng-container></mat-hint>
        </mat-form-field>
        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label><ng-container i18n>Legal business name</ng-container></mat-label>
          <input matInput formControlName="legalName" autocomplete="off" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>Contact person</ng-container></mat-label>
          <input matInput formControlName="contactName" autocomplete="off" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>Telephone</ng-container></mat-label>
          <input matInput formControlName="contactPhone" autocomplete="off" inputmode="tel" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label><ng-container i18n>Email</ng-container></mat-label>
          <input matInput formControlName="contactEmail" autocomplete="off" inputmode="email" />
          @if (form.controls.contactEmail.invalid) { <mat-error><ng-container i18n>That email address does not look right.</ng-container></mat-error> }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>City</ng-container></mat-label>
          <input matInput formControlName="city" autocomplete="off" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label><ng-container i18n>Country</ng-container></mat-label>
          <input matInput formControlName="country" autocomplete="off" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label><ng-container i18n>Internal notes</ng-container></mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
      @if (error()) {
        <p class="m-0 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900" role="alert"><mat-icon class="!h-5 !w-5 !text-xl !leading-none text-red-600">error</mat-icon>{{ error() }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!px-6 !pb-4">
      <button matButton mat-dialog-close [disabled]="saving()"><ng-container i18n>Cancel</ng-container></button>
      <button matButton="filled" type="submit" form="partner-form" [disabled]="saving()">
        @if (saving()) { <mat-spinner diameter="18" /> } @else { <ng-container i18n>Save partner</ng-container> }
      </button>
    </mat-dialog-actions>
  `,
})
export class PartnerDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PartnerService);
  private readonly ref = inject<MatDialogRef<PartnerDialogComponent, Partner>>(MatDialogRef);
  readonly data = inject<PartnerDialogData>(MAT_DIALOG_DATA);

  readonly types = PARTNER_TYPES;
  readonly typeLabel = (t: string) => PARTNER_TYPE_LABELS[t as keyof typeof PARTNER_TYPE_LABELS]();
  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    name: [this.data.partner?.name ?? '', [Validators.required, Validators.minLength(2)]],
    type: [this.data.partner?.type ?? 'travel_agency'],
    code: [this.data.partner?.code ?? ''],
    legalName: [this.data.partner?.legalName ?? ''],
    contactName: [this.data.partner?.contact?.name ?? ''],
    contactPhone: [this.data.partner?.contact?.phone ?? ''],
    contactEmail: [this.data.partner?.contact?.email ?? '', [Validators.email]],
    city: [this.data.partner?.address?.city ?? ''],
    country: [this.data.partner?.address?.country ?? ''],
    notes: [this.data.partner?.notes ?? ''],
  });

  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue();
    const input = {
      name: v.name.trim(), type: v.type, code: v.code.trim() || undefined, legalName: v.legalName.trim(), notes: v.notes,
      contact: { name: v.contactName, phone: v.contactPhone, email: v.contactEmail },
      address: { city: v.city, country: v.country },
    };
    this.saving.set(true);
    this.error.set('');
    const call = this.data.partner ? this.api.update(this.data.storeId, this.data.partner._id, input) : this.api.create(this.data.storeId, input);
    call.subscribe({
      next: (partner) => this.ref.close(partner),
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.message ?? $localize`Could not save the partner. Try again.`);
      },
    });
  }
}
