import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreStore } from '../../stores/store.store';
import { AuthService } from '../../services/auth.service';
import { MaintenanceCategoryService } from '../../services/maintenance-category.service';

@Component({
  selector: 'app-maintenance-category-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>New Maintenance Category</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="space-y-4 pt-2">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Category Name *</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Plumbing, Electrical" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2" placeholder="Brief description"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Icon (Material Icon Name)</mat-label>
          <input matInput formControlName="icon" placeholder="e.g. plumbing, electrical_services" />
          <mat-hint>Use Material Design icon names</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        (click)="onSubmit()"
        [disabled]="form.invalid || submitting()"
      >
        @if (submitting()) {
          <mat-spinner diameter="18"></mat-spinner>
        }
        Create Category
      </button>
    </mat-dialog-actions>
  `,
})
export class MaintenanceCategoryCreateDialogComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private storeStore = inject(StoreStore);
  private authService = inject(AuthService);
  private categoryService = inject(MaintenanceCategoryService);
  private dialogRef = inject(MatDialogRef<MaintenanceCategoryCreateDialogComponent>);

  readonly submitting = signal<boolean>(false);

  form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    icon: [''],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name ?? '',
      description: raw.description || undefined,
      icon: raw.icon || undefined,
      createdBy: this.authService.currentUserValue?._id,
    };

    this.categoryService.create(storeId, payload).subscribe({
      next: (res) => {
        this.snackBar.open('Category created', 'Close', { duration: 3000 });
        this.dialogRef.close(res.data);
      },
      error: (error) => {
        const message = error?.error?.message || 'Failed to create category';
        this.snackBar.open(message, 'Close', { duration: 4000 });
        this.submitting.set(false);
      },
    });
  }
}
