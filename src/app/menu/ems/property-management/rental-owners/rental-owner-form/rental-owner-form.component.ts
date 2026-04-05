import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RentalOwnerService } from '../../../../../shared/services/rental-owner.service';
import { RentalOwnerStatus } from '../../../../../shared/models/estate.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-rental-owner-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './rental-owner-form.component.html',
})
export class RentalOwnerFormComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private rentalOwnerService = inject(RentalOwnerService);
  private storeStore = inject(StoreStore);

  private ownerId = this.route.snapshot.paramMap.get('id');
  isEditMode = signal<boolean>(!!this.ownerId);
  isSaving = signal<boolean>(false);
  isCompany = signal<boolean>(false);

  statusOptions = [
    { value: RentalOwnerStatus.ACTIVE, label: 'Active' },
    { value: RentalOwnerStatus.INACTIVE, label: 'Inactive' },
  ];

  form = this.fb.group({
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

  constructor() {
    if (this.ownerId) {
      this.loadOwner();
    }

    this.form.get('isCompany')?.valueChanges.subscribe((val) => {
      this.isCompany.set(!!val);
    });
  }

  private loadOwner(): void {
    if (!this.ownerId) return;
    this.rentalOwnerService.getRentalOwnerById(this.ownerId).subscribe({
      next: (res) => {
        const owner = res.data;
        this.form.patchValue({
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
        this.isCompany.set(owner.isCompany);
      },
      error: () => {
        this.snackBar.open('Failed to load rental owner', 'Close', { duration: 5000 });
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const data: any = { ...this.form.value };

    // Only include store on create (must not change on update)
    if (!this.isEditMode()) {
      data.store = this.storeStore.selectedStore()?._id;
    }

    const request$ = this.isEditMode()
      ? this.rentalOwnerService.updateRentalOwner(this.ownerId!, data)
      : this.rentalOwnerService.createRentalOwner(data);

    request$.subscribe({
      next: (res) => {
        this.snackBar.open(
          this.isEditMode() ? 'Rental owner updated' : 'Rental owner created',
          'Close',
          { duration: 3000 },
        );
        if (this.isEditMode()) {
          this.router.navigate(['../../', this.ownerId], { relativeTo: this.route });
        } else {
          this.router.navigate(['../', res.data._id], { relativeTo: this.route });
        }
      },
      error: (err) => {
        this.snackBar.open(
          err?.error?.message || 'Failed to save rental owner',
          'Close',
          { duration: 5000 },
        );
        this.isSaving.set(false);
      },
    });
  }

  cancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['../../', this.ownerId], { relativeTo: this.route });
    } else {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }
}
