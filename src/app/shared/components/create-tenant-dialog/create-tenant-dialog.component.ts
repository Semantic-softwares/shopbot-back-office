import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TenantService } from '../../services/tenant.service';
import { StoreStore } from '../../stores/store.store';
import { Tenant, TenantStatus } from '../../models/estate.model';

@Component({
  selector: 'app-create-tenant-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-tenant-dialog.component.html',
  styleUrl: './create-tenant-dialog.component.scss',
})
export class CreateTenantDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateTenantDialogComponent>);
  private tenantService = inject(TenantService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);

  readonly isSaving = signal<boolean>(false);

  readonly form: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', Validators.email],
    phone: [''],
    isCompany: [false],
    companyName: [''],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const v = this.form.value;
    const storeId = this.storeStore.selectedStore()?._id;

    const data: Partial<Tenant> = {
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email || undefined,
      phoneNumbers: v.phone ? [v.phone] : [],
      isCompany: !!v.isCompany,
      companyName: v.isCompany ? v.companyName || undefined : undefined,
      status: TenantStatus.ACTIVE,
      store: storeId,
    } as Partial<Tenant>;

    this.tenantService.createTenant(data).subscribe({
      next: (res) => {
        this.snackBar.open('Tenant created', 'Close', { duration: 3000 });
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        this.snackBar.open(
          err?.error?.message || 'Failed to create tenant',
          'Close',
          { duration: 5000 },
        );
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
