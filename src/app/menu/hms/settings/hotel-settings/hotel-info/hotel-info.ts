import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StoreStore } from '../../../../../shared/stores/store.store';
import { StoreService } from '../../../../../shared/services/store.service';

@Component({
  selector: 'app-hotel-info',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './hotel-info.html',
  styleUrl: './hotel-info.scss',
})
export class HotelInfo implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private storeService = inject(StoreService);
  public storeStore = inject(StoreStore);

  loading = signal(false);
  saving = signal(false);
  
  hotelInfoForm!: FormGroup;

  timezoneOptions = [
    { value: 'UTC-12', label: '(GMT-12:00) International Date Line West' },
    { value: 'UTC-11', label: '(GMT-11:00) Midway Island, Samoa' },
    { value: 'UTC-10', label: '(GMT-10:00) Hawaii' },
    { value: 'UTC-9', label: '(GMT-09:00) Alaska' },
    { value: 'UTC-8', label: '(GMT-08:00) Pacific Time (US & Canada)' },
    { value: 'UTC-7', label: '(GMT-07:00) Mountain Time (US & Canada)' },
    { value: 'UTC-6', label: '(GMT-06:00) Central Time (US & Canada)' },
    { value: 'UTC-5', label: '(GMT-05:00) Eastern Time (US & Canada)' },
    { value: 'UTC-4', label: '(GMT-04:00) Atlantic Time (Canada)' },
    { value: 'UTC-3', label: '(GMT-03:00) Buenos Aires, Georgetown' },
    { value: 'UTC-2', label: '(GMT-02:00) Mid-Atlantic' },
    { value: 'UTC-1', label: '(GMT-01:00) Azores, Cape Verde Islands' },
    { value: 'UTC+0', label: '(GMT+00:00) Greenwich Mean Time' },
    { value: 'UTC+1', label: '(GMT+01:00) Amsterdam, Berlin, Rome' },
    { value: 'UTC+2', label: '(GMT+02:00) Cairo, Athens, Istanbul' },
    { value: 'UTC+3', label: '(GMT+03:00) Moscow, Kuwait, Riyadh' },
    { value: 'UTC+4', label: '(GMT+04:00) Abu Dhabi, Muscat' },
    { value: 'UTC+5', label: '(GMT+05:00) Islamabad, Karachi' },
    { value: 'UTC+6', label: '(GMT+06:00) Almaty, Dhaka' },
    { value: 'UTC+7', label: '(GMT+07:00) Bangkok, Hanoi, Jakarta' },
    { value: 'UTC+8', label: '(GMT+08:00) Beijing, Perth, Singapore' },
    { value: 'UTC+9', label: '(GMT+09:00) Tokyo, Seoul, Osaka' },
    { value: 'UTC+10', label: '(GMT+10:00) Eastern Australia, Guam' },
    { value: 'UTC+11', label: '(GMT+11:00) Magadan, Solomon Islands' },
    { value: 'UTC+12', label: '(GMT+12:00) Auckland, Wellington' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadSettings();
  }

  private initializeForm(): void {
    this.hotelInfoForm = this.fb.group({
      hotelName: ['', Validators.required],
      address: this.fb.group({
        street: [''],
        city: ['', Validators.required],
        state: [''],
        country: ['', Validators.required],
        postalCode: ['']
      }),
      contactInfo: this.fb.group({
        phone: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        website: ['']
      }),
      timezone: ['UTC+0', Validators.required],
      checkInTime: ['15:00', Validators.required],
      checkOutTime: ['11:00', Validators.required]
    });
  }

  private loadSettings(): void {
    this.loading.set(true);
    
    const store = this.storeStore.selectedStore();
    if (store) {
      this.hotelInfoForm.patchValue({
        hotelName: store.name || '',
        address: {
          street: store.contactInfo?.address || '',
          city: store.contactInfo?.city || '',
          state: store.contactInfo?.state || '',
          country: store.contactInfo?.country || '',
          postalCode: store.contactInfo?.postalCode || ''
        },
        contactInfo: {
          phone: store.contactInfo?.phone || '',
          email: store.contactInfo?.email || '',
          website: store.contactInfo?.placeName || ''
        },
        timezone: store.hotelSettings?.operationalSettings?.timezone || 'UTC+0',
        checkInTime: store.hotelSettings?.operationalSettings?.checkInTime || '15:00',
        checkOutTime: store.hotelSettings?.operationalSettings?.checkOutTime || '11:00'
      });
    }
    
    this.loading.set(false);
  }

  saveHotelInfo(): void {
    if (this.hotelInfoForm.valid && this.storeStore.selectedStore()) {
      this.saving.set(true);
      
      const formValue = this.hotelInfoForm.value;
      const currentStore = this.storeStore.selectedStore()!;
      
      const storeUpdatePayload = {
        name: formValue.hotelName,
        contactInfo: {
          ...currentStore.contactInfo,
          phone: formValue.contactInfo.phone,
          email: formValue.contactInfo.email,
          address: formValue.address.street,
          city: formValue.address.city,
          state: formValue.address.state,
          country: formValue.address.country,
          postalCode: formValue.address.postalCode,
          placeName: formValue.contactInfo.website,
          placeNumber: currentStore.contactInfo?.placeNumber || ''
        },
        hotelSettings: {
          ...currentStore.hotelSettings,
          operationalSettings: {
            timezone: formValue.timezone,
            checkInTime: formValue.checkInTime,
            checkOutTime: formValue.checkOutTime
          }
        }
      };

      this.storeService.updateStore(currentStore._id, storeUpdatePayload).subscribe({
        next: () => {
          this.storeService.getStore(currentStore._id).subscribe({
            next: (updatedStore) => {
              this.storeStore.updateStore(updatedStore);
              this.storeService.saveStoreLocally(updatedStore);
              this.saving.set(false);
              this.snackBar.open('Hotel information saved successfully!', 'Close', { duration: 3000 });
            },
            error: (fetchError) => {
              console.error('Error fetching updated store:', fetchError);
              this.saving.set(false);
              this.snackBar.open('Settings saved but failed to update local data.', 'Close', { duration: 5000 });
            }
          });
        },
        error: (error) => {
          console.error('Error saving hotel info:', error);
          this.saving.set(false);
          this.snackBar.open('Failed to save hotel information.', 'Close', { duration: 5000 });
        }
      });
    }
  }
}
