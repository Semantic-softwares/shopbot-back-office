import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom, map } from 'rxjs';
import { MODULE_OPTIONS } from '../../billing/module-options';
import { ModuleKey } from '../../models';
import { Store } from '../../models/store.model';
import { AuthService } from '../../services/auth.service';
import { StoreService } from '../../services/store.service';
import { ValidationErrorsDialogComponent, ValidationErrorsDialogData } from '../validation-errors-dialog/validation-errors-dialog.component';

/**
 * "Add a store" from inside the app: the signed-in person owns the new store, picks its modules and starts a 14-day trial for it,
 * without signing out and signing up again. The server takes the owner from the sign-in, so nothing here can name another owner.
 * Closes with the new store, or nothing when cancelled.
 */
@Component({
  selector: 'app-add-store-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title class="!pb-1 text-xl font-bold"><ng-container i18n>Add a new store</ng-container></h2>
    <mat-dialog-content class="max-h-[72vh] overflow-y-auto !pt-2">
      <p class="mb-5 mt-0 text-sm text-gray-500"><ng-container i18n>You will be the owner. The new store gets its own 14-day free trial and its own team, settings and billing.</ng-container></p>

      <form [formGroup]="form" class="flex flex-col gap-1" (ngSubmit)="submit()" id="add-store-form">
        <h4 class="mb-3 mt-0 text-sm font-semibold text-gray-700"><ng-container i18n>Business</ng-container></h4>
        <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label><ng-container i18n>Business Name</ng-container></mat-label>
            <input matInput formControlName="name" placeholder="Name of the new store" i18n-placeholder maxlength="100" required data-testid="store-name" />
            @if (form.controls.name.hasError('required') || form.controls.name.hasError('blank')) { <mat-error><ng-container i18n>Business name is required</ng-container></mat-error> }
            @else if (form.controls.name.hasError('minlength')) { <mat-error><ng-container i18n>Business name must be at least 2 characters</ng-container></mat-error> }
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label><ng-container i18n>Business Type</ng-container></mat-label>
            <mat-select formControlName="storeType" required data-testid="store-type">
              @for (type of storeTypes; track type.value) { <mat-option [value]="type.value">{{ type.label }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label><ng-container i18n>Country</ng-container></mat-label>
            <mat-select formControlName="country" (selectionChange)="selectCountry($event.value)" required data-testid="store-country">
              @for (zone of zones.value(); track zone.country) { <mat-option [value]="zone.country">{{ zone.country }}</mat-option> }
            </mat-select>
            @if (form.controls.country.hasError('required')) { <mat-error><ng-container i18n>Country is required</ng-container></mat-error> }
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label><ng-container i18n>Currency</ng-container></mat-label>
            <input matInput formControlName="currency" readonly placeholder="Auto-filled" i18n-placeholder />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Billing Email</ng-container></mat-label>
          <input matInput formControlName="billingEmail" type="email" required data-testid="store-billing-email" />
          <mat-icon matSuffix fontSet="material-icons-outlined">receipt_long</mat-icon>
          <mat-hint><ng-container i18n>Invoices and billing notices for this store go here</ng-container></mat-hint>
          @if (form.controls.billingEmail.hasError('required')) { <mat-error><ng-container i18n>Billing email is required</ng-container></mat-error> }
          @else if (form.controls.billingEmail.hasError('email')) { <mat-error><ng-container i18n>Please enter a valid billing email</ng-container></mat-error> }
        </mat-form-field>

        <h4 class="mb-1 mt-6 text-sm font-semibold text-gray-700"><ng-container i18n>Modules</ng-container></h4>
        <p class="mb-3 mt-0 text-xs text-gray-500"><ng-container i18n>All modules, one price. Switch on what this store needs now and change it any time.</ng-container></p>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label="Modules" i18n-aria-label>
          @for (m of modules; track m.id) {
            <button type="button" (click)="toggle(m.id)" [attr.aria-pressed]="isOn(m.id)" [attr.data-testid]="'add-module-' + m.id"
                    class="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all"
                    [class]="isOn(m.id) ? 'border-2 border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'">
              <span class="flex h-10 w-10 flex-none items-center justify-center rounded-xl" [class]="isOn(m.id) ? 'bg-blue-100' : 'bg-gray-100'">
                <mat-icon [class]="isOn(m.id) ? 'text-blue-600' : 'text-gray-600'" fontSet="material-icons-outlined">{{ m.icon }}</mat-icon>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-semibold" [class]="isOn(m.id) ? 'text-blue-900' : 'text-gray-900'">{{ m.label }}</span>
                <span class="mt-0.5 block text-xs leading-relaxed text-gray-500">{{ m.description }}</span>
              </span>
              <span class="flex h-6 w-6 flex-none items-center justify-center rounded-full border" [class]="isOn(m.id) ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 bg-white text-transparent'">
                <mat-icon style="font-size:14px;width:14px;height:14px;">check</mat-icon>
              </span>
            </button>
          }
        </div>
        @if (!chosen().length && attempted()) { <p class="mb-0 mt-2 text-xs text-red-600" role="alert"><ng-container i18n>Select at least one module</ng-container></p> }

        <mat-accordion class="mt-5" displayMode="flat">
          <mat-expansion-panel class="!shadow-none" [expanded]="false">
            <mat-expansion-panel-header class="!px-0"><mat-panel-title class="text-sm font-semibold text-gray-700"><ng-container i18n>More details (optional)</ng-container></mat-panel-title></mat-expansion-panel-header>
            <div class="flex flex-col pt-2">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label><ng-container i18n>Description</ng-container></mat-label>
                <textarea matInput formControlName="description" rows="2" maxlength="500" placeholder="Brief description of your business" i18n-placeholder></textarea>
              </mat-form-field>
              <div formGroupName="contactInfo" class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label><ng-container i18n>Business Email</ng-container></mat-label>
                  <input matInput formControlName="email" type="email" placeholder="contact@business.com" i18n-placeholder />
                  @if (form.controls.contactInfo.controls.email.hasError('email')) { <mat-error><ng-container i18n>Please enter a valid email</ng-container></mat-error> }
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label><ng-container i18n>Business Phone</ng-container></mat-label>
                  <input matInput formControlName="phone" type="tel" placeholder="Business phone" i18n-placeholder />
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full sm:col-span-2">
                  <mat-label><ng-container i18n>Address</ng-container></mat-label>
                  <input matInput formControlName="address" placeholder="Street address" i18n-placeholder />
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label><ng-container i18n>City</ng-container></mat-label>
                  <input matInput formControlName="city" placeholder="City" i18n-placeholder />
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label><ng-container i18n>State</ng-container></mat-label>
                  <mat-select formControlName="state">
                    @for (state of states(); track state.name) { <mat-option [value]="state.name">{{ state.name }}</mat-option> }
                  </mat-select>
                  @if (!states().length) { <mat-hint><ng-container i18n>Select a country first</ng-container></mat-hint> }
                </mat-form-field>
              </div>
            </div>
          </mat-expansion-panel>
        </mat-accordion>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="add-store-actions">
      <button mat-stroked-button type="button" (click)="ref.close()" [disabled]="saving()" data-testid="add-store-cancel"><ng-container i18n>Cancel</ng-container></button>
      <button mat-flat-button color="primary" type="submit" form="add-store-form" class="add-store-actions__save" [disabled]="saving()" data-testid="add-store-submit">
        @if (saving()) { <mat-progress-spinner mode="indeterminate" [diameter]="18" class="add-store-actions__spinner"></mat-progress-spinner> } @else { <mat-icon>add_business</mat-icon> }
        <span>@if (saving()) { <ng-container i18n>Creating…</ng-container> } @else { <ng-container i18n>Create store</ng-container> }</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .add-store-actions { gap: 8px; padding: 12px 24px 20px; border-top: 1px solid var(--mat-sys-outline-variant); }
    .add-store-actions__save { min-width: 148px; }
    .add-store-actions__save .add-store-actions__spinner { margin-right: 8px; }
    :host ::ng-deep .add-store-actions__spinner circle { stroke: currentColor; }
    @media (max-width: 480px) { .add-store-actions { flex-direction: column-reverse; align-items: stretch; padding: 12px 16px 16px; } .add-store-actions button { width: 100%; } }
  `,
})
export class AddStoreDialogComponent {
  readonly ref = inject(MatDialogRef<AddStoreDialogComponent, Store | undefined>);
  private readonly fb = inject(FormBuilder);
  private readonly storeService = inject(StoreService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly modules = MODULE_OPTIONS;
  readonly storeTypes = [
    { value: 'restaurant', label: $localize`Restaurant` },
    { value: 'hotel', label: $localize`Hotel` },
    { value: 'real_estate', label: $localize`Real Estate` },
  ];
  readonly zones = rxResource({ stream: () => this.storeService.deliveryZones() });

  readonly chosen = signal<ModuleKey[]>(['PMS', 'POS', 'ERP']);
  readonly saving = signal(false);
  readonly attempted = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), (c: { value: string }) => (c.value && !c.value.trim() ? { blank: true } : null)]],
    storeType: ['hotel', Validators.required],
    billingEmail: [this.auth.currentUserValue?.email ?? '', [Validators.required, Validators.email]],
    description: [''],
    currency: ['', Validators.required],
    currencyCode: ['', Validators.required],
    country: ['', Validators.required],
    contactInfo: this.fb.nonNullable.group({ email: ['', Validators.email], phone: [''], address: [''], city: [''], state: [''] }),
  });

  readonly states = toSignal(
    this.form.controls.country.valueChanges.pipe(map((country) => (this.zones.value()?.find((z: any) => z.country === country)?.states ?? []) as Array<{ name: string }>)),
    { initialValue: [] as Array<{ name: string }> },
  );

  isOn = (id: ModuleKey) => this.chosen().includes(id);
  toggle(id: ModuleKey): void {
    this.chosen.update((cur) => (cur.includes(id) ? cur.filter((k) => k !== id) : [...cur, id]));
  }

  selectCountry(country: string): void {
    const zone = this.zones.value()?.find((z: any) => z.country === country);
    if (zone) this.form.patchValue({ currency: zone.currency, currencyCode: zone.currencyCode });
  }

  private readonly labels: Record<string, string> = {
    name: $localize`Business name`,
    storeType: $localize`Business type`,
    billingEmail: $localize`Billing email`,
    country: $localize`Country`,
    currency: $localize`Currency`,
    currencyCode: $localize`Currency`,
    'contactInfo.email': $localize`Business email`,
    modules: $localize`Modules`,
  };

  private problemWith(path: string): string {
    const errors = this.form.get(path)?.errors ?? {};
    if (errors['required'] || errors['blank']) return $localize`This is required.`;
    if (errors['email']) return $localize`Enter a valid email address, like name@example.com.`;
    if (errors['minlength']) return $localize`Use at least ${errors['minlength'].requiredLength} characters.`;
    return $localize`This value is not valid.`;
  }

  async submit(): Promise<void> {
    if (this.saving()) return;
    this.attempted.set(true);
    // Nothing is sent until the form is complete; the person is told in plain words what is missing.
    const invalid = ['name', 'storeType', 'country', 'currency', 'billingEmail', 'contactInfo.email'].filter((p) => this.form.get(p)?.invalid);
    const noModules = this.chosen().length === 0;
    if (invalid.length || noModules) {
      this.form.markAllAsTouched();
      const labels: NonNullable<ValidationErrorsDialogData['labels']> = {};
      const controls = [...invalid];
      for (const p of invalid) labels[p] = { title: this.labels[p] ?? p, detail: p === 'currency' ? $localize`Choose a country and the currency fills in.` : this.problemWith(p) };
      if (noModules) {
        controls.push('modules');
        labels['modules'] = { title: this.labels['modules'], detail: $localize`Select at least one module.` };
      }
      this.openDialog(controls, labels, $localize`Check the store details`, $localize`Please fix the following before creating the store:`);
      return;
    }

    this.saving.set(true);
    try {
      const v = this.form.getRawValue();
      const store = await firstValueFrom(this.storeService.addMyStore({
        name: v.name.trim(), storeType: v.storeType, description: v.description, country: v.country, currency: v.currency, currencyCode: v.currencyCode,
        billingEmail: v.billingEmail.trim(), contactInfo: { ...v.contactInfo, country: v.country }, modules: this.chosen(),
      }));
      this.ref.close(store);
    } catch (error) {
      this.showServerErrors(error);
    } finally {
      this.saving.set(false);
    }
  }

  private showServerErrors(error: unknown): void {
    const raw = error instanceof HttpErrorResponse ? (error.error?.message ?? error.error?.error) : null;
    const reasons: string[] = (Array.isArray(raw) ? raw : raw ? [raw] : []).map(String);
    if (error instanceof HttpErrorResponse && error.status === 0) reasons.push($localize`No connection. Check your internet and try again.`);
    if (!reasons.length) reasons.push($localize`Something went wrong on our side. Please try again.`);
    const labels: NonNullable<ValidationErrorsDialogData['labels']> = {};
    for (const r of reasons) labels[r] = { title: r };
    this.openDialog(reasons, labels, $localize`Could not create the store`, $localize`The store was not created:`);
  }

  private openDialog(invalidControls: string[], labels: NonNullable<ValidationErrorsDialogData['labels']>, title: string, message: string): void {
    this.dialog.open(ValidationErrorsDialogComponent, { data: { invalidControls, labels, title, message } as ValidationErrorsDialogData, width: '480px', maxWidth: '92vw', autoFocus: false });
  }
}
