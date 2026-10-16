import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RefundService } from '../../../../shared/services/refund.service';
import { Order } from '../../../../shared/models/order.model';

export interface VoidDialogData {
  orderId: string;
  reference?: string;
}

/** Cancels an order that has not been paid. A reason is required and recorded with who did it. */
@Component({
  selector: 'app-void-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title>
      <ng-container i18n>Void this order?</ng-container>
      @if (data.reference) { <span class="ml-2 text-on-surface-variant font-normal">#{{ data.reference }}</span> }
    </h2>
    <mat-dialog-content>
      <p class="mb-3 text-sm text-on-surface-variant">
        <ng-container i18n>No money has been taken, so nothing is refunded. The order is cancelled, its table is freed and unprinted tickets are withdrawn.</ng-container>
      </p>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label><ng-container i18n>Reason</ng-container></mat-label>
        <textarea matInput rows="2" maxlength="300" [ngModel]="reason()" (ngModelChange)="reason.set($event)"></textarea>
      </mat-form-field>
      @if (needsPin()) {
        <mat-form-field appearance="outline" class="w-full">
          <mat-label><ng-container i18n>Manager or owner PIN</ng-container></mat-label>
          <input matInput type="password" inputmode="numeric" autocomplete="off" maxlength="12" [ngModel]="pin()" (ngModelChange)="pin.set($event)" />
          <mat-hint><ng-container i18n>A manager must approve this.</ng-container></mat-hint>
        </mat-form-field>
      }
      @if (error()) {
        <p class="mt-2 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container" role="alert">{{ error() }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!px-6 !pb-4">
      <button matButton (click)="close()" [disabled]="submitting()"><ng-container i18n>Keep order</ng-container></button>
      <button matButton="filled" color="warn" [disabled]="!canSubmit()" (click)="submit()">
        @if (submitting()) { <mat-spinner diameter="18" class="mr-2 inline-block"></mat-spinner> }
        <ng-container i18n>Void order</ng-container>
      </button>
    </mat-dialog-actions>
  `,
})
export class VoidDialogComponent {
  public data = inject<VoidDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<VoidDialogComponent, Order | undefined>);
  private refundService = inject(RefundService);

  public reason = signal('');
  public pin = signal('');
  public needsPin = signal(false);
  public submitting = signal(false);
  public error = signal<string | null>(null);

  public canSubmit = computed(
    () => !this.submitting() && this.reason().trim().length > 0 && (!this.needsPin() || this.pin().trim().length > 0),
  );

  public submit(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.error.set(null);
    this.refundService
      .voidOrder(this.data.orderId, { reason: this.reason().trim(), approverPin: this.needsPin() ? this.pin().trim() : undefined })
      .subscribe({
        next: (order) => this.dialogRef.close(order),
        error: (err) => {
          this.submitting.set(false);
          if (err?.status === 403 && err?.error?.code === 'APPROVAL_REQUIRED') this.needsPin.set(true);
          this.error.set(err?.error?.message || $localize`The order could not be voided. Please try again.`);
        },
      });
  }

  public close(): void {
    this.dialogRef.close(undefined);
  }
}
