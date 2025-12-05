import { Component, inject, signal } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StoreService } from '../../../../../shared/services/store.service';

export interface PinAuthorizationDialogData {
  storeId: string;
  actionDescription: string;
  reservationId: string;
}

export interface PinAuthorizationDialogResult {
  authorized: boolean;
  pin?: string;
}

@Component({
  selector: 'app-pin-authorization-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
],
  templateUrl: './pin-authorization-dialog.component.html',
  styleUrls: ['./pin-authorization-dialog.component.scss']
})
export class PinAuthorizationDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PinAuthorizationDialogComponent>);
  private data = inject<PinAuthorizationDialogData>(MAT_DIALOG_DATA);
  private storeService = inject(StoreService);

  // Signals for reactive state
  verifying = signal(false);
  error = signal<string | null>(null);
  showPin = signal(false);

  // Form for PIN input
  pinForm: FormGroup;

  constructor() {
    this.pinForm = this.fb.group({
      pin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6)]]
    });
  }

  get actionDescription(): string {
    return this.data.actionDescription || 'perform this action';
  }

  get storeId(): string {
    return this.data.storeId;
  }

  togglePinVisibility() {
    this.showPin.set(!this.showPin());
  }

  async verifyPin() {
    if (this.pinForm.invalid) {
      this.pinForm.markAllAsTouched();
      return;
    }

    const pin = this.pinForm.get('pin')?.value;
    if (!pin) return;

    this.verifying.set(true);
    this.error.set(null);

    try {
      // Call the store service to validate the PIN
      const isValid = await this.storeService.validateStoreOwnerPin(this.storeId, pin).toPromise();
      
      if (isValid) {
        // PIN is valid, close dialog with success
        this.dialogRef.close({
          authorized: true,
          pin: pin
        } as PinAuthorizationDialogResult);
      } else {
        // PIN is invalid
        this.error.set('Invalid PIN. Please check with the store owner for the correct PIN.');
        this.pinForm.get('pin')?.setErrors({ 'invalid': true });
      }
    } catch (error) {
      console.error('Error validating PIN:', error);
      this.error.set('Unable to verify PIN. Please check your connection and try again.');
    } finally {
      this.verifying.set(false);
    }
  }

  cancel() {
    this.dialogRef.close({
      authorized: false
    } as PinAuthorizationDialogResult);
  }

  // Handle Enter key press in PIN input
  onPinKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.pinForm.valid && !this.verifying()) {
      this.verifyPin();
    }
  }

  // Clear error when user starts typing
  onPinInput() {
    if (this.error()) {
      this.error.set(null);
      this.pinForm.get('pin')?.setErrors(null);
    }
  }
}