import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PartnerPortalApiService, PortalReservation, messageOf, newKey } from './partner-portal-api.service';

export interface AmendDialogData {
  storeId: string;
  reservation: PortalReservation;
  kind: 'change' | 'cancel';
}

/** Ask the hotel to change or cancel a reservation. The hotel makes the change itself; nothing happens until it does. */
@Component({
  selector: 'app-partner-amend-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title>@if (data.kind === 'cancel') { <ng-container i18n>Ask to cancel</ng-container> } @else { <ng-container i18n>Ask for a change</ng-container> } {{ data.reservation.confirmationNumber }}</h2>
    <mat-dialog-content>
      <p class="mt-0 text-sm text-on-surface-variant" i18n>The hotel will look at your request and get back to you. Your reservation stays as it is until then.</p>
      <form [formGroup]="form" id="amend-form" (ngSubmit)="send()" class="flex flex-col" novalidate>
        @if (data.kind === 'change') {
          <div class="grid grid-cols-2 gap-x-3">
            <mat-form-field appearance="outline"><mat-label i18n>New check-in (optional)</mat-label><input matInput type="date" formControlName="proposedCheckIn" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label i18n>New check-out (optional)</mat-label><input matInput type="date" formControlName="proposedCheckOut" /></mat-form-field>
          </div>
        }
        <mat-form-field appearance="outline">
          <mat-label>@if (data.kind === 'cancel') { <ng-container i18n>Why are you cancelling?</ng-container> } @else { <ng-container i18n>What should change?</ng-container> }</mat-label>
          <textarea matInput rows="3" formControlName="text" maxlength="1000"></textarea>
          @if (form.controls.text.touched && form.controls.text.invalid) { <mat-error i18n>Tell the hotel in a few words.</mat-error> }
        </mat-form-field>
      </form>
      @if (error()) { <p class="m-0 rounded-xl bg-red-50 p-3 text-sm text-red-900" role="alert">{{ error() }}</p> }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!px-6 !pb-4">
      <button matButton mat-dialog-close i18n>Close</button>
      <button matButton="filled" type="submit" form="amend-form" [disabled]="busy()">@if (busy()) { <mat-spinner diameter="18" /> } @else { <ng-container i18n>Send to the hotel</ng-container> }</button>
    </mat-dialog-actions>
  `,
})
export class PartnerAmendDialogComponent {
  private readonly api = inject(PartnerPortalApiService);
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject<MatDialogRef<PartnerAmendDialogComponent, boolean>>(MatDialogRef);
  readonly data = inject<AmendDialogData>(MAT_DIALOG_DATA);
  private readonly key = newKey();

  readonly form = this.fb.nonNullable.group({ text: ['', [Validators.required, Validators.minLength(3)]], proposedCheckIn: [''], proposedCheckOut: [''] });
  readonly busy = signal(false);
  readonly error = signal('');

  send() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    const v = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    const body = this.data.kind === 'cancel' ? { idempotencyKey: this.key, reason: v.text } : { idempotencyKey: this.key, note: v.text, proposedCheckIn: v.proposedCheckIn || undefined, proposedCheckOut: v.proposedCheckOut || undefined };
    this.api.amend(this.data.storeId, this.data.reservation._id, this.data.kind, body).subscribe({
      next: () => this.ref.close(true),
      error: (e) => { this.busy.set(false); this.error.set(messageOf(e, $localize`The request could not be sent. Try again.`)); },
    });
  }
}
