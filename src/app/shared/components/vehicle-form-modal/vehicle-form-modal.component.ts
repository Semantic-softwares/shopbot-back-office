import {
  Component,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Vehicle, VehicleType } from '../../models/estate.model';

export interface VehicleFormDialogData {
  vehicle?: Partial<Vehicle>;
}

@Component({
  selector: 'app-vehicle-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './vehicle-form-modal.component.html',
})
export class VehicleFormModalComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<VehicleFormModalComponent>);
  private data: VehicleFormDialogData = inject(MAT_DIALOG_DATA, { optional: true }) ?? {};

  readonly vehicleTypes: { value: VehicleType; label: string }[] = [
    { value: VehicleType.CAR, label: 'Car' },
    { value: VehicleType.SUV, label: 'SUV' },
    { value: VehicleType.TRUCK, label: 'Truck' },
    { value: VehicleType.VAN, label: 'Van' },
    { value: VehicleType.MOTORCYCLE, label: 'Motorcycle' },
    { value: VehicleType.BUS, label: 'Bus' },
    { value: VehicleType.OTHER, label: 'Other' },
  ];

  readonly currentYear = new Date().getFullYear();

  form = this.fb.group({
    make: [this.data.vehicle?.make ?? '', Validators.required],
    model: [this.data.vehicle?.model ?? '', Validators.required],
    year: [this.data.vehicle?.year ?? null as number | null],
    color: [this.data.vehicle?.color ?? ''],
    licensePlate: [this.data.vehicle?.licensePlate ?? ''],
    stateOfRegistration: [this.data.vehicle?.stateOfRegistration ?? ''],
    vin: [this.data.vehicle?.vin ?? ''],
    type: [this.data.vehicle?.type ?? VehicleType.CAR, Validators.required],
    notes: [this.data.vehicle?.notes ?? ''],
  });

  get isEdit(): boolean {
    return !!this.data.vehicle?._id;
  }

  onConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const result: Partial<Vehicle> = {
      make: value.make!,
      model: value.model!,
      year: value.year ? Number(value.year) : undefined,
      color: value.color || undefined,
      licensePlate: value.licensePlate || undefined,
      stateOfRegistration: value.stateOfRegistration || undefined,
      vin: value.vin || undefined,
      type: value.type as VehicleType,
      notes: value.notes || undefined,
    };

    if (this.data.vehicle?._id) {
      result._id = this.data.vehicle._id;
    }

    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
