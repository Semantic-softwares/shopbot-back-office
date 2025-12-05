import { Component, inject, signal } from '@angular/core';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Reservation } from '../../../../../shared/models/reservation.model';

export interface CheckInDialogData {
  reservation: Reservation;
}

export interface CheckInDialogResult {
  confirmed: boolean;
  roomChecks: {
    isClean: boolean;
    isMaintained: boolean;
    amenitiesReady: boolean;
  };
  notes?: string;
}

@Component({
  selector: 'app-check-in-confirmation-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
],
  templateUrl: './check-in-confirmation-dialog.component.html',
  styleUrls: ['./check-in-confirmation-dialog.component.scss']
})
export class CheckInConfirmationDialogComponent {
  private dialogRef = inject(MatDialogRef<CheckInConfirmationDialogComponent>);
  private fb = inject(FormBuilder);
  public data = inject<CheckInDialogData>(MAT_DIALOG_DATA);

  loading = signal(false);

  checkInForm = this.fb.group({
    isClean: [false, Validators.requiredTrue],
    isMaintained: [false, Validators.requiredTrue],
    amenitiesReady: [false, Validators.requiredTrue],
    notes: ['']
  });

  get isFormValid(): boolean {
    return this.checkInForm.valid;
  }

  get roomNumbers(): string {
    if (!this.data.reservation.rooms) return '';
    return this.data.reservation.rooms
      .map((roomRes: any) => {
        const room = roomRes.room;
        return typeof room === 'string' ? room : room.roomNumber || room._id;
      })
      .join(', ');
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  onConfirm(): void {
    if (!this.isFormValid) return;

    const formValue = this.checkInForm.value;
    const result: CheckInDialogResult = {
      confirmed: true,
      roomChecks: {
        isClean: formValue.isClean || false,
        isMaintained: formValue.isMaintained || false,
        amenitiesReady: formValue.amenitiesReady || false
      },
      notes: formValue.notes || undefined
    };

    this.dialogRef.close(result);
  }
}