import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AccountingTaxService } from '../../../../shared/services/accounting-tax.service';
import { Tax, TaxKind, TaxUsage } from '../../../../shared/models/tax.model';

export interface TaxDialogData {
  storeId: string;
  tax?: Tax;
}

const SUGGESTED_CODE: Record<TaxKind, 'TC01' | 'TC02' | 'TC03'> = { standard: 'TC01', zero_rated: 'TC02', exempt: 'TC03' };

@Component({
  selector: 'app-tax-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>@if (data.tax) { <ng-container i18n>Edit tax</ng-container> } @else { <ng-container i18n>Add tax</ng-container> }</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="!pt-2">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <mat-form-field appearance="outline">
            <mat-label i18n>Tax name</mat-label>
            <input matInput formControlName="name" required data-testid="tax-name" />
            @if (form.controls.name.invalid && form.controls.name.touched) { <mat-error i18n>Enter a name</mat-error> }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label i18n>Code</mat-label>
            <input matInput formControlName="code" data-testid="tax-code" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label i18n>Treatment</mat-label>
            <mat-select formControlName="kind" data-testid="tax-kind">
              <mat-option value="standard" i18n>Standard rate</mat-option>
              <mat-option value="zero_rated" i18n>Zero-rated</mat-option>
              <mat-option value="exempt" i18n>Exempt</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label i18n>Percentage (%)</mat-label>
            <input matInput type="number" min="0" max="100" step="0.01" formControlName="rate" required data-testid="tax-rate" />
            @if (form.controls.rate.invalid && form.controls.rate.touched) { <mat-error i18n>Enter a rate between 0 and 100</mat-error> }
          </mat-form-field>

          <mat-form-field appearance="outline" class="sm:col-span-2">
            <mat-label i18n>MRA tax code</mat-label>
            <mat-select formControlName="mraTaxCode" data-testid="tax-mra-code">
              <mat-option [value]="null" i18n>None (not sent to MRA)</mat-option>
              <mat-option value="TC01" i18n>TC01 · VAT 15%</mat-option>
              <mat-option value="TC02" i18n>TC02 · Zero-rated</mat-option>
              <mat-option value="TC03" i18n>TC03 · Exempt</mat-option>
              <mat-option value="TC04" i18n>TC04 · Non-fiscal</mat-option>
            </mat-select>
            <mat-hint i18n>Needed for invoices sent to MRA. A tax without a code cannot be used on an MRA invoice.</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="sm:col-span-2 !mt-4">
            <mat-label i18n>Description</mat-label>
            <input matInput formControlName="description" />
          </mat-form-field>
        </div>

        @if (data.tax) {
          <mat-slide-toggle formControlName="isActive" data-testid="tax-active" i18n>Active</mat-slide-toggle>
          @if (usage(); as u) {
            <p class="mt-3 text-xs text-gray-600" data-testid="tax-usage">
              <ng-container i18n>Used by {{ u.count }} product(s). A change only applies to sales made from now on; past orders and receipts keep the rate they were sold with.</ng-container>
            </p>
          }
        }
        @if (error()) { <p class="mt-3 text-sm text-red-700" role="alert">{{ error() }}</p> }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close i18n>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving()" data-testid="tax-save" i18n>Save</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class TaxDialogComponent {
  protected readonly data = inject<TaxDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<TaxDialogComponent, Tax>);
  private readonly api = inject(AccountingTaxService);
  private readonly fb = inject(FormBuilder);

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly usage = signal<TaxUsage | null>(null);

  protected readonly form = this.fb.group({
    name: [this.data.tax?.name ?? '', [Validators.required, Validators.maxLength(60)]],
    code: [this.data.tax?.code ?? ''],
    kind: [this.data.tax?.kind ?? ('standard' as TaxKind)],
    rate: [this.data.tax?.rate ?? 15, [Validators.required, Validators.min(0), Validators.max(100)]],
    mraTaxCode: [(this.data.tax?.mraTaxCode ?? (this.data.tax ? null : 'TC01')) as string | null],
    description: [this.data.tax?.description ?? ''],
    isActive: [this.data.tax?.isActive ?? true],
  });

  constructor() {
    if (this.data.tax) this.api.usage(this.data.tax._id).subscribe((u) => this.usage.set(u));
    // Zero-rated and exempt taxes are 0% by definition; the matching MRA code is suggested.
    this.form.controls.kind.valueChanges.subscribe((kind) => {
      if (kind !== 'standard') this.form.controls.rate.setValue(0);
      this.form.controls.rate[kind === 'standard' ? 'enable' : 'disable']({ emitEvent: false });
      this.form.controls.mraTaxCode.setValue(SUGGESTED_CODE[kind as TaxKind]);
    });
    if (this.form.controls.kind.value !== 'standard') this.form.controls.rate.disable({ emitEvent: false });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: Partial<Tax> = {
      name: v.name!.trim(),
      code: v.code?.trim() ?? '',
      kind: v.kind as TaxKind,
      rate: Number(v.rate),
      description: v.description?.trim() ?? '',
      mraTaxCode: (v.mraTaxCode as Tax['mraTaxCode']) ?? null,
      ...(this.data.tax ? { isActive: !!v.isActive } : {}),
    };
    if (!this.data.tax && body.mraTaxCode === null) delete body.mraTaxCode; // create: omit rather than send null
    this.saving.set(true);
    this.error.set(null);
    const request = this.data.tax ? this.api.update(this.data.tax._id, body) : this.api.create(this.data.storeId, body);
    request.subscribe({
      next: (tax) => this.ref.close(tax),
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.message ? [].concat(e.error.message).join(' ') : $localize`Something went wrong. Please try again.`);
      },
    });
  }
}
