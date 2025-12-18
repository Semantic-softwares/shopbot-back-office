import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerToggle } from '@angular/material/datepicker';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { GuestService } from '../../services/guest.service';
import { LocationService, Country, Nationality } from '../../services/location.service';
import { Guest } from '../../models/reservation.model';
import { StoreStore } from '../../stores/store.store';
import { GuestSearchComponent } from '../guest-search/guest-search.component';

@Component({
  selector: 'app-guest-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDatepickerToggle,
    MatTabsModule,
    GuestSearchComponent
  ],
  templateUrl: './guest-form-modal.component.html',
  styleUrl: './guest-form-modal.component.scss'
})
export class GuestFormModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<GuestFormModalComponent>);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private guestService = inject(GuestService);
  private storeStore = inject(StoreStore);
  private locationService = inject(LocationService);
  private dialogData = inject(MAT_DIALOG_DATA, { optional: true });
  private destroy$ = new Subject<void>();

  // Signals
  isSaving = signal<boolean>(false);
  countries = signal<Country[]>([]);
  nationalities = signal<Nationality[]>([]);
  guestType = signal<'individual' | 'corporate'>('individual');
  ageGrade = signal<'adult' | 'child'>('adult');
  isEditing = signal<boolean>(false);
  editingGuestId = signal<string | null>(null);
  isChildGuest = computed(() => this.ageGrade() === 'child');

  // Form
  guestForm: FormGroup;

  constructor() {
    // Determine if we're editing a guest
    const existingGuest = this.dialogData?.guest;
    const bookingType = this.dialogData?.bookingType || 'single';
    const ageGradeValue = this.dialogData?.ageGrade || 'adult';
    
    // Set age grade (defaults to adult)
    this.ageGrade.set(ageGradeValue);
    
    if (existingGuest) {
      this.isEditing.set(true);
      this.editingGuestId.set(existingGuest._id);
      // If guest has no guestType, treat as individual
      const guestTypeValue = existingGuest.guestType || 'individual';
      this.guestType.set(guestTypeValue);
    } else {
      // For new guests, if ageGrade is child, treat as individual
      // Otherwise set type based on booking type
      if (ageGradeValue === 'child') {
        this.guestType.set('individual');
      } else if (bookingType === 'group') {
        this.guestType.set('corporate');
      }
    }
    
    this.guestForm = this.createForm();
    this.countries.set(this.locationService.getCountries());
    this.nationalities.set(this.locationService.getNationalities());
    
    // If editing, populate form with existing guest data
    if (existingGuest) {
      this.populateFormWithGuest(existingGuest);
    }
  }

  ngOnInit() {
    // Update validation based on guest type
    this.updateValidators();
  }

  private populateFormWithGuest(guest: Guest): void {
    const guestData: any = {
      guestType: guest.guestType || 'individual',
      email: guest.email || '',
      phone: guest.phone || '',
      nationality: guest.nationality || '',
      dateOfBirth: guest.dateOfBirth || '',
      firstName: guest.firstName || '',
      lastName: guest.lastName || '',
      companyName: guest.companyName || '',
      companyRegistrationNumber: guest.companyRegistrationNumber || '',
      contactPersonFirstName: guest.contactPersonFirstName || '',
      contactPersonLastName: guest.contactPersonLastName || '',
      contactPersonTitle: guest.contactPersonTitle || '',
      notes: guest.notes || '',
      idDocument: {
        type: guest.idDocument?.type || 'passport',
        number: guest.idDocument?.number || '',
        expiryDate: guest.idDocument?.expiryDate || '',
        issuingCountry: guest.idDocument?.issuingCountry || ''
      },
      address: {
        street: guest.address?.street || '',
        city: guest.address?.city || '',
        state: guest.address?.state || '',
        country: guest.address?.country || '',
        postalCode: guest.address?.postalCode || ''
      },
      emergencyContact: {
        name: guest.emergencyContact?.name || '',
        relationship: guest.emergencyContact?.relationship || '',
        phone: guest.emergencyContact?.phone || '',
        email: guest.emergencyContact?.email || ''
      }
    };
    
    this.guestForm.patchValue(guestData);
  }

  private updateValidators(): void {
    const guestType = this.guestType();
    const isChildGuest = this.isChildGuest();
    const firstNameControl = this.guestForm.get('firstName');
    const lastNameControl = this.guestForm.get('lastName');
    const emailControl = this.guestForm.get('email');
    const phoneControl = this.guestForm.get('phone');
    const companyNameControl = this.guestForm.get('companyName');
    const contactFirstControl = this.guestForm.get('contactPersonFirstName');
    const contactLastControl = this.guestForm.get('contactPersonLastName');

    if (isChildGuest || guestType === 'individual') {
      // Individual validations (includes child guests)
      firstNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      lastNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      
      // Email and phone are only required for adult guests
      if (isChildGuest) {
        emailControl?.clearValidators();
        phoneControl?.clearValidators();
      } else {
        emailControl?.setValidators([Validators.required, Validators.email]);
        phoneControl?.setValidators([Validators.required]);
      }
      
      companyNameControl?.clearValidators();
      contactFirstControl?.clearValidators();
      contactLastControl?.clearValidators();
    } else if (guestType === 'corporate') {
      // Corporate validations
      firstNameControl?.clearValidators();
      lastNameControl?.clearValidators();
      emailControl?.setValidators([Validators.required, Validators.email]);
      phoneControl?.setValidators([Validators.required]);
      companyNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      contactFirstControl?.setValidators([Validators.required, Validators.minLength(2)]);
      contactLastControl?.setValidators([Validators.required, Validators.minLength(2)]);
    }

    firstNameControl?.updateValueAndValidity();
    lastNameControl?.updateValueAndValidity();
    emailControl?.updateValueAndValidity();
    phoneControl?.updateValueAndValidity();
    companyNameControl?.updateValueAndValidity();
    contactFirstControl?.updateValueAndValidity();
    contactLastControl?.updateValueAndValidity();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      guestType: [this.guestType(), [Validators.required]],
      // Individual fields - add validators conditionally
      firstName: [''],
      lastName: [''],
      dateOfBirth: [''],
      nationality: [''],
      // Corporate fields - add validators conditionally
      companyName: [''],
      companyRegistrationNumber: [''],
      contactPersonFirstName: [''],
      contactPersonLastName: [''],
      contactPersonTitle: [''],
      // Common fields
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
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
        country: [''],
        postalCode: ['']
      }),
      emergencyContact: this.fb.group({
        name: [''],
        relationship: [''],
        phone: [''],
        email: ['']
      }),
      notes: ['']
    });
  }

  get addressForm(): FormGroup {
    return this.guestForm.get('address') as FormGroup;
  }

  get emergencyContactForm(): FormGroup {
    return this.guestForm.get('emergencyContact') as FormGroup;
  }

  get idDocumentForm(): FormGroup {
    return this.guestForm.get('idDocument') as FormGroup;
  }

  /**
   * Handle selection of an existing guest from search results
   */
  onSelectExistingGuest(guest: Guest): void {
    this.dialogRef.close(guest);
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

      let result;
      if (this.isEditing()) {
        // Update existing guest
        const guestId = this.editingGuestId();
        if (!guestId) {
          this.showError('Guest ID is missing');
          return;
        }
        result = await this.guestService.updateGuest(guestId, guestData).toPromise();
        this.showSuccess('Guest updated successfully');
      } else {
        // Create new guest
        result = await this.guestService.createGuest(guestData).toPromise();
        this.showSuccess('Guest created successfully');
      }
      
      // Return the guest to the parent component
      this.dialogRef.close(result);
    } catch (error) {
      console.error('Error saving guest:', error);
      this.showError(this.isEditing() ? 'Failed to update guest' : 'Failed to create guest');
    } finally {
      this.isSaving.set(false);
    }
  }

  private prepareGuestData(formValue: any): Partial<Guest> {
    const currentStoreId = this.storeStore.selectedStore()?._id;
    const guestType = formValue.guestType || 'individual';
    const isChildGuest = this.isChildGuest();

    // For child guests, only include essential fields
    if (isChildGuest) {
      return {
        guestType: 'individual',
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        dateOfBirth: formValue.dateOfBirth,
        stores: currentStoreId ? [currentStoreId] : []
      };
    }

    const baseData = {
      guestType,
      email: formValue.email,
      phone: formValue.phone,
      idDocument: formValue.idDocument,
      address: formValue.address,
      emergencyContact: formValue.emergencyContact,
      notes: formValue.notes,
      stores: currentStoreId ? [currentStoreId] : []
    };

    if (guestType === 'individual') {
      return {
        ...baseData,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        dateOfBirth: formValue.dateOfBirth,
        nationality: formValue.nationality,
      };
    } else {
      return {
        ...baseData,
        companyName: formValue.companyName,
        companyRegistrationNumber: formValue.companyRegistrationNumber,
        contactPersonFirstName: formValue.contactPersonFirstName,
        contactPersonLastName: formValue.contactPersonLastName,
        contactPersonTitle: formValue.contactPersonTitle,
      };
    }
  }

  onCancel() {
    this.dialogRef.close();
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
