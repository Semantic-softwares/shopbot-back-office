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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Pet, PetType } from '../../models/estate.model';

export interface PetFormDialogData {
  pet?: Partial<Pet>;
}

@Component({
  selector: 'app-pet-form-modal',
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
    MatSlideToggleModule,
  ],
  templateUrl: './pet-form-modal.component.html',
})
export class PetFormModalComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PetFormModalComponent>);
  private data: PetFormDialogData = inject(MAT_DIALOG_DATA, { optional: true }) ?? {};

  readonly petTypes: { value: PetType; label: string }[] = [
    { value: PetType.DOG, label: 'Dog' },
    { value: PetType.CAT, label: 'Cat' },
    { value: PetType.BIRD, label: 'Bird' },
    { value: PetType.FISH, label: 'Fish' },
    { value: PetType.RABBIT, label: 'Rabbit' },
    { value: PetType.REPTILE, label: 'Reptile' },
    { value: PetType.OTHER, label: 'Other' },
  ];

  form = this.fb.group({
    name: [this.data.pet?.name ?? '', Validators.required],
    type: [this.data.pet?.type ?? PetType.DOG, Validators.required],
    breed: [this.data.pet?.breed ?? ''],
    color: [this.data.pet?.color ?? ''],
    weight: [this.data.pet?.weight ?? null as number | null],
    age: [this.data.pet?.age ?? null as number | null],
    vaccinated: [this.data.pet?.vaccinated ?? false],
    licensed: [this.data.pet?.licensed ?? false],
    licenseNumber: [this.data.pet?.licenseNumber ?? ''],
    notes: [this.data.pet?.notes ?? ''],
  });

  get isEdit(): boolean {
    return !!this.data.pet?._id;
  }

  onConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const result: Partial<Pet> = {
      name: value.name!,
      type: value.type as PetType,
      breed: value.breed || undefined,
      color: value.color || undefined,
      weight: value.weight ? Number(value.weight) : undefined,
      age: value.age ? Number(value.age) : undefined,
      vaccinated: !!value.vaccinated,
      licensed: !!value.licensed,
      licenseNumber: value.licenseNumber || undefined,
      notes: value.notes || undefined,
    };

    if (this.data.pet?._id) {
      result._id = this.data.pet._id;
    }

    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
