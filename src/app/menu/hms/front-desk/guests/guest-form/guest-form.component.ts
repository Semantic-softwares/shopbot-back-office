import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { GuestService } from '../../../../../shared/services/guest.service';
import { Guest } from '../../../../../shared/models/reservation.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-guest-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    PageHeaderComponent
  ],
  templateUrl: './guest-form.component.html',
  styleUrl: './guest-form.component.scss'
})
export class GuestFormComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private guestService = inject(GuestService);
  private storeStore = inject(StoreStore);
  private destroy$ = new Subject<void>();

  // Signals
  guest = signal<Guest | null>(null);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  guestId = signal<string | null>(null);

  // Form
  guestForm: FormGroup;

  // Computed properties
  isEditMode = computed(() => !!this.guestId());
  pageTitle = computed(() => this.isEditMode() ? 'Edit Guest' : 'Create Guest');
  submitButtonText = computed(() => this.isEditMode() ? 'Update Guest' : 'Create Guest');
  selectedStore = computed(() => this.storeStore.selectedStore());

  // Country options
  countryOptions = [
    { code: 'US', name: 'United States' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'AU', name: 'Australia' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'CN', name: 'China' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'AR', name: 'Argentina' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'EG', name: 'Egypt' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SA', name: 'Saudi Arabia' }
  ];

  constructor() {
    this.guestForm = this.createForm();
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      this.guestId.set(id || null);
      
      if (this.isEditMode()) {
        this.loadGuest(id);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      dateOfBirth: [''],
      nationality: [''],
      idDocument: this.fb.group({
        type: ['passport'],
        number: [''],
        expiryDate: [''],
        issuingCountry: ['']
      }),
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        postalCode: [''],
        country: ['']
      }),
      preferences: this.fb.group({
        roomType: [''],
        smokingPreference: ['non_smoking'],
        bedPreference: ['no_preference'],
        floorPreference: ['no_preference'],
        specialRequests: [[]]
      }),
      emergencyContact: this.fb.group({
        name: [''],
        relationship: [''],
        phone: [''],
        email: ['']
      }),
      isVip: [false],
      blacklisted: [false],
      notes: ['']
    });
  }

  async loadGuest(id: string) {
    this.isLoading.set(true);
    try {
      const guest = await this.guestService.getGuestById(id).toPromise();
      if (guest) {
        this.guest.set(guest);
        this.populateForm(guest);
      } else {
        throw new Error('Guest not found');
      }
    } catch (error) {
      console.error('Error loading guest:', error);
      this.showError('Failed to load guest information');
      this.router.navigate(['/menu/hms/front-desk/guests/list']);
    } finally {
      this.isLoading.set(false);
    }
  }

  private populateForm(guest: Guest) {
    this.guestForm.patchValue({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      dateOfBirth: guest.dateOfBirth ? new Date(guest.dateOfBirth) : null,
      nationality: guest.nationality,
      idDocument: {
        type: guest.idDocument?.type || 'passport',
        number: guest.idDocument?.number || '',
        expiryDate: guest.idDocument?.expiryDate ? new Date(guest.idDocument.expiryDate) : null,
        issuingCountry: guest.idDocument?.issuingCountry || ''
      },
      address: {
        street: guest.address?.street || '',
        city: guest.address?.city || '',
        state: guest.address?.state || '',
        postalCode: guest.address?.postalCode || '',
        country: guest.address?.country || ''
      },
      preferences: {
        roomType: guest.preferences?.roomType || '',
        smokingPreference: guest.preferences?.smokingPreference || 'non_smoking',
        bedPreference: guest.preferences?.bedPreference || 'no_preference',
        floorPreference: guest.preferences?.floorPreference || 'no_preference',
        specialRequests: guest.preferences?.specialRequests || []
      },
      emergencyContact: {
        name: guest.emergencyContact?.name || '',
        relationship: guest.emergencyContact?.relationship || '',
        phone: guest.emergencyContact?.phone || '',
        email: guest.emergencyContact?.email || ''
      },
      isVip: guest.isVip || false,
      blacklisted: guest.blacklisted || false,
      notes: guest.notes || ''
    });
  }

  async onSubmit() {
    if (this.guestForm.invalid) {
      this.markFormGroupTouched(this.guestForm);
      this.showError('Please fill in all required fields correctly');
      return;
    }

    this.isSaving.set(true);
    try {
      const formValue = this.guestForm.value;
      const guestData = this.prepareGuestData(formValue);

      if (this.isEditMode()) {
        await this.guestService.updateGuest(this.guestId()!, guestData).toPromise();
        this.showSuccess('Guest updated successfully');
      } else {
        await this.guestService.createGuest(guestData).toPromise();
        this.showSuccess('Guest created successfully');
      }

      // Navigate back to the guests list using absolute path
      this.router.navigate(['/menu/hms/front-desk/guests/list']);
    } catch (error) {
      console.error('Error saving guest:', error);
      this.showError('Failed to save guest information');
    } finally {
      this.isSaving.set(false);
    }
  }

  private prepareGuestData(formValue: any): Partial<Guest> {
    const currentStoreId = this.storeStore.selectedStore()?._id;
    
    return {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone,
      dateOfBirth: formValue.dateOfBirth,
      nationality: formValue.nationality,
      idDocument: formValue.idDocument,
      address: formValue.address,
      preferences: formValue.preferences,
      emergencyContact: formValue.emergencyContact,
      isVip: formValue.isVip,
      blacklisted: formValue.blacklisted,
      notes: formValue.notes,
      stores: currentStoreId ? [currentStoreId] : [] // Add current store to stores array
    };
  }

  onCancel() {
    this.router.navigate(['/menu/hms/front-desk/guests/list']);
  }

  getFieldError(fieldName: string): string {
    const field = this.guestForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid phone number';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone Number'
    };
    return labels[fieldName] || fieldName;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}