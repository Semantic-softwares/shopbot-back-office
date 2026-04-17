import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { MaintenanceCategorySelectComponent } from '../../../../../shared/components/maintenance-category-select/maintenance-category-select.component';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { MaintenanceVendorService } from '../../../../../shared/services/maintenance-vendor.service';

@Component({
  selector: 'app-vendor-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    PageHeaderComponent,
    MaintenanceCategorySelectComponent,
  ],
  templateUrl: './vendor-form.component.html',
})
export class VendorFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private storeStore = inject(StoreStore);
  private vendorService = inject(MaintenanceVendorService);

  private vendorId = this.route.snapshot.paramMap.get('id');
  readonly isEditMode = computed(() => !!this.vendorId);
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

  constructor() {
    this.loadEditData();
  }

  private loadEditData(): void {
    if (!this.vendorId) return;
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this.vendorService.getById(storeId, this.vendorId).subscribe({
      next: (res) => {
        const v = res.data;
        this.form.patchValue({
          name: v.name,
          email: v.email ?? '',
          phone: v.phone ?? '',
          company: v.company ?? false,
          specialty: v.specialty ?? '',
          category: v.category ?? '',
          address: v.address ?? '',
          notes: v.notes ?? '',
        });
        if (v.profileImage) {
          this.profileImagePreview.set(v.profileImage);
        }
      },
      error: () => {
        this.snackBar.open('Failed to load vendor', 'Close', { duration: 4000 });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/menu/ems/maintenance/vendors']);
  }

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

    let profileImage: string | undefined = this.profileImagePreview() || undefined;

    // Upload new profile image if selected
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
    };

    const request$ = this.vendorId
      ? this.vendorService.update(storeId, this.vendorId, payload)
      : this.vendorService.create(storeId, payload);

    request$.subscribe({
      next: () => {
        const msg = this.vendorId ? 'Vendor updated' : 'Vendor created';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
        this.goBack();
      },
      error: (error) => {
        const message = error?.error?.message || 'Failed to save vendor';
        this.snackBar.open(message, 'Close', { duration: 4000 });
        this.submitting.set(false);
      },
    });
  }
}
