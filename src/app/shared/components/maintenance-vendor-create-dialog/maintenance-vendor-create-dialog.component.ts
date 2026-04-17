import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { StoreStore } from '../../stores/store.store';
import { AuthService } from '../../services/auth.service';
import { MaintenanceVendorService } from '../../services/maintenance-vendor.service';
import { MaintenanceCategorySelectComponent } from '../maintenance-category-select/maintenance-category-select.component';

@Component({
  selector: 'app-maintenance-vendor-create-dialog',
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
    MatSlideToggleModule,
    MaintenanceCategorySelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>New Vendor</h2>
    <mat-dialog-content class="!max-h-[70vh]">
      <form [formGroup]="form" class="space-y-4 pt-2">
        <!-- Profile Image Upload -->
        <div class="flex items-center gap-4">
          <div class="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
            @if (profileImagePreview()) {
              <img [src]="profileImagePreview()" alt="Vendor profile" class="w-full h-full object-cover" />
              <button
                type="button"
                class="absolute top-0 right-0 bg-white/90 rounded-full p-0.5"
                (click)="removeProfileImage()"
                aria-label="Remove profile image"
              >
                <mat-icon class="!text-sm">close</mat-icon>
              </button>
            } @else {
              <mat-icon class="!text-2xl text-gray-400">person</mat-icon>
            }
          </div>
          <label class="cursor-pointer">
            <input type="file" accept="image/*" class="hidden" (change)="onProfileImageSelected($event)" />
            <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
              <mat-icon>upload</mat-icon>
              {{ profileImagePreview() ? 'Change' : 'Upload Photo' }}
            </span>
          </label>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>{{ form.controls.company.value ? 'Company Name *' : 'Vendor Name *' }}</mat-label>
            <input matInput formControlName="name" [placeholder]="form.controls.company.value ? 'Enter company name' : 'Enter vendor name'" />
            @if (form.controls.name.hasError('required')) {
              <mat-error>Name is required</mat-error>
            }
          </mat-form-field>

          <div class="flex items-center">
            <mat-slide-toggle formControlName="company" color="primary">
              Is a Company
            </mat-slide-toggle>
          </div>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" placeholder="vendor@example.com" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phone" placeholder="Phone number" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Specialty</mat-label>
            <input matInput formControlName="specialty" placeholder="e.g. Plumbing, Electrical" />
          </mat-form-field>

          <app-maintenance-category-select
            [control]="$any(form.controls.category)"
            label="Category"
          />

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Address</mat-label>
            <input matInput formControlName="address" placeholder="Vendor address" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2" placeholder="Additional notes"></textarea>
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
        Create Vendor
      </button>
    </mat-dialog-actions>
  `,
})
export class MaintenanceVendorCreateDialogComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private storeStore = inject(StoreStore);
  private authService = inject(AuthService);
  private vendorService = inject(MaintenanceVendorService);
  private dialogRef = inject(MatDialogRef<MaintenanceVendorCreateDialogComponent>);

  readonly submitting = signal<boolean>(false);
  readonly profileImagePreview = signal<string>('');
  private profileImageFile = signal<File | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.email]],
    phone: [''],
    company: [false],
    specialty: [''],
    category: [''],
    address: [''],
    notes: [''],
  });

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.profileImageFile.set(file);
    this.profileImagePreview.set(URL.createObjectURL(file));
  }

  removeProfileImage(): void {
    this.profileImageFile.set(null);
    this.profileImagePreview.set('');
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this.submitting.set(true);
    const raw = this.form.getRawValue();

    let profileImage: string | undefined;
    const imageFile = this.profileImageFile();
    if (imageFile) {
      try {
        const uploadRes = await firstValueFrom(this.vendorService.uploadProfileImage(storeId, imageFile));
        profileImage = uploadRes.data.photos?.[0];
      } catch {
        this.snackBar.open('Failed to upload profile image', 'Close', { duration: 4000 });
        this.submitting.set(false);
        return;
      }
    }

    const payload = {
      name: raw.name ?? '',
      email: raw.email || undefined,
      phone: raw.phone || undefined,
      company: raw.company ?? false,
      specialty: raw.specialty || undefined,
      category: raw.category || undefined,
      profileImage,
      address: raw.address || undefined,
      notes: raw.notes || undefined,
      createdBy: this.authService.currentUserValue?._id,
    };

    this.vendorService.create(storeId, payload).subscribe({
      next: (res) => {
        this.snackBar.open('Vendor created', 'Close', { duration: 3000 });
        this.dialogRef.close(res.data);
      },
      error: (error) => {
        const message = error?.error?.message || 'Failed to create vendor';
        this.snackBar.open(message, 'Close', { duration: 4000 });
        this.submitting.set(false);
      },
    });
  }
}
