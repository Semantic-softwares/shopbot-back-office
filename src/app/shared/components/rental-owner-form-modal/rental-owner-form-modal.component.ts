import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { RentalOwnerService } from '../../services/rental-owner.service';
import { RentalOwner, RentalOwnerStatus } from '../../models/estate.model';
import { StoreStore } from '../../stores/store.store';
import { RentalOwnerSearchComponent } from '../rental-owner-search/rental-owner-search.component';

export interface RentalOwnerFormModalData {
  owner?: RentalOwner;
}

@Component({
  selector: 'app-rental-owner-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    RentalOwnerSearchComponent,
  ],
  templateUrl: './rental-owner-form-modal.component.html',
})
export class RentalOwnerFormModalComponent implements OnDestroy {
  private dialogRef = inject(MatDialogRef<RentalOwnerFormModalComponent>);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private rentalOwnerService = inject(RentalOwnerService);
  private storeStore = inject(StoreStore);
  private dialogData = inject<RentalOwnerFormModalData>(MAT_DIALOG_DATA, { optional: true });
  private destroy$ = new Subject<void>();

  isSaving = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isCompany = signal<boolean>(false);
  editingOwnerId = signal<string | null>(null);

  ownerForm: FormGroup;

  statusOptions = [
    { value: RentalOwnerStatus.ACTIVE, label: 'Active' },
    { value: RentalOwnerStatus.INACTIVE, label: 'Inactive' },
  ];

  constructor() {
    const existingOwner = this.dialogData?.owner;
    if (existingOwner) {
      this.isEditing.set(true);
      this.editingOwnerId.set(existingOwner._id);
      this.isCompany.set(existingOwner.isCompany);
    }

    this.ownerForm = this.createForm();

    if (existingOwner) {
      this.populateForm(existingOwner);
    }

    this.ownerForm.get('isCompany')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.isCompany.set(!!val));
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', Validators.email],
      phone: [''],
      alternatePhone: [''],
      isCompany: [false],
      companyName: [''],
      taxId: [''],
      notes: [''],
      status: [RentalOwnerStatus.ACTIVE],
    });
  }

  private populateForm(owner: RentalOwner): void {
    this.ownerForm.patchValue({
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email || '',
      phone: owner.phone || '',
      alternatePhone: owner.alternatePhone || '',
      isCompany: owner.isCompany,
      companyName: owner.companyName || '',
      taxId: owner.taxId || '',
      notes: owner.notes || '',
      status: owner.status,
    });
  }

  onSelectExistingOwner(owner: RentalOwner): void {
    this.dialogRef.close(owner);
  }

  onSubmit(): void {
    if (this.ownerForm.invalid) {
      this.markFormGroupTouched(this.ownerForm);
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 5000 });
      return;
    }

    this.isSaving.set(true);
    const formValue = this.ownerForm.value;
    const storeId = this.storeStore.selectedStore()?._id;

    const data: any = { ...formValue };
    if (!this.isEditing()) {
      data.store = storeId;
    }

    const request$ = this.isEditing()
      ? this.rentalOwnerService.updateRentalOwner(this.editingOwnerId()!, data)
      : this.rentalOwnerService.createRentalOwner(data);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.snackBar.open(
          this.isEditing() ? 'Owner updated' : 'Owner created',
          'Close',
          { duration: 3000 },
        );
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        this.snackBar.open(
          err?.error?.message || 'Failed to save owner',
          'Close',
          { duration: 5000 },
        );
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
