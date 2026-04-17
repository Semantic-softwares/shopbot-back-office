import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaintenanceVendorService } from '../../services/maintenance-vendor.service';
import { MaintenanceCategoryService } from '../../services/maintenance-category.service';
import { MaintenanceService } from '../../services/maintenance.service';
import { MaintenanceVendor } from '../../models/maintenance-vendor.model';
import { MaintenanceAssigneeType } from '../../models/maintenance.model';

export interface AssignVendorDialogData {
  storeId: string;
  requestId: string;
  currentVendorId?: string;
  requestTitle?: string;
}

@Component({
  selector: 'app-assign-vendor-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './assign-vendor-dialog.component.html',
})
export class AssignVendorDialogComponent {
  private dialogRef = inject(MatDialogRef<AssignVendorDialogComponent>);
  private data: AssignVendorDialogData = inject(MAT_DIALOG_DATA);
  private vendorService = inject(MaintenanceVendorService);
  private categoryService = inject(MaintenanceCategoryService);
  private maintenanceService = inject(MaintenanceService);
  private snackBar = inject(MatSnackBar);

  readonly submitting = signal<boolean>(false);
  readonly selectedVendorId = signal<string>(this.data.currentVendorId ?? '');
  readonly categoryFilter = new FormControl<string>('', { nonNullable: true });
  readonly noteControl = new FormControl<string>('', { nonNullable: true });
  readonly requestTitle = this.data.requestTitle ?? '';

  readonly categoriesResource = rxResource({
    params: () => ({ storeId: this.data.storeId }),
    stream: ({ params }) =>
      params.storeId ? this.categoryService.getAllActive(params.storeId) : of(undefined),
  });

  readonly categoryOptions = computed(() => {
    const data = this.categoriesResource.value()?.data;
    return [
      { value: '', label: 'All Categories' },
      ...(data?.map((c: { name: string }) => ({ value: c.name, label: c.name })) ?? []),
    ];
  });

  readonly vendorsResource = rxResource({
    params: () => ({
      storeId: this.data.storeId,
      category: this.categoryFilter.value,
    }),
    stream: ({ params }) =>
      params.storeId
        ? this.vendorService.getAll(params.storeId, {
            isActive: 'true',
            category: params.category || undefined,
            limit: 300,
          })
        : of(undefined),
  });

  readonly vendors = computed<MaintenanceVendor[]>(
    () => this.vendorsResource.value()?.data?.items ?? [],
  );

  onCategoryChange(): void {
    this.vendorsResource.reload();
  }

  selectVendor(vendorId: string): void {
    this.selectedVendorId.set(vendorId);
  }

  assign(): void {
    const vendorId = this.selectedVendorId();
    if (!vendorId) return;

    this.submitting.set(true);
    this.maintenanceService
      .assign(this.data.storeId, this.data.requestId, {
        assigneeType: MaintenanceAssigneeType.VENDOR,
        assigneeId: vendorId,
        note: this.noteControl.value.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Vendor assigned successfully', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          const message = error?.error?.message || 'Failed to assign vendor';
          this.snackBar.open(message, 'Close', { duration: 4000 });
          this.submitting.set(false);
        },
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
