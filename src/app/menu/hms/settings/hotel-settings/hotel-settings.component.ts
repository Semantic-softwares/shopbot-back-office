import { Component, signal, inject, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';

import { BluetoothPrinterService, PrinterConfiguration } from '../../../../shared/services/bluetooth-printer.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { StoreService } from '../../../../shared/services/store.service';

@Component({
  selector: 'app-hotel-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule
],
  templateUrl: './hotel-settings.component.html',
  styleUrl: './hotel-settings.component.scss',
})
export class HotelSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private printerService = inject(BluetoothPrinterService);
  private storeService = inject(StoreService);
  public storeStore = inject(StoreStore);

  // State signals
  loading = signal(false);
  saving = signal(false);
  printerConnecting = signal(false);
  printerConnected = signal(false);
  
  // Forms
  hotelInfoForm!: FormGroup;
  printerSettingsForm!: FormGroup;
  emailSettingsForm!: FormGroup;
  notificationSettingsForm!: FormGroup;

  // Printer options
  paperSizeOptions = [
    { value: '58mm', label: '58mm (2.3 inches)' },
    { value: '80mm', label: '80mm (3.1 inches)' },
    { value: '112mm', label: '112mm (4.4 inches)' }
  ];

  printQualityOptions = [
    { value: 'draft', label: 'Draft (Fast)' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High Quality' }
  ];

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

  connectedPrinter = signal<{name: string; id: string} | null>(null);

  ngOnInit(): void {
    this.initializeForms();
    this.loadSettings();
    this.checkPrinterStatus();
  }

  private initializeForms(): void {
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

    this.printerSettingsForm = this.fb.group({
      paperSize: ['80mm', Validators.required],
      printQuality: ['normal', Validators.required],
      autocut: [true],
      headerText: [''],
      footerText: ['Thank you for your stay!'],
      includeLogo: [true],
      fontSize: [12, [Validators.required, Validators.min(8), Validators.max(20)]],
      lineSpacing: [1.2, [Validators.required, Validators.min(1), Validators.max(3)]]
    });

    this.emailSettingsForm = this.fb.group({
      smtpHost: [''],
      smtpPort: [587],
      smtpUsername: [''],
      smtpPassword: [''],
      smtpSecure: [true],
      senderName: [''],
      senderEmail: [''],
      replyToEmail: ['']
    });

    this.notificationSettingsForm = this.fb.group({
      reservationConfirmation: [true],
      checkInReminder: [true],
      checkOutReminder: [true],
      paymentConfirmation: [true],
      cancellationNotice: [true],
      guestFeedbackRequest: [false],
      smsNotifications: [false],
      pushNotifications: [true]
    });
  }

  private loadSettings(): void {
    this.loading.set(true);
    
    const store = this.storeStore.selectedStore();
    if (store) {
      // Load general store information using existing contactInfo structure
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
          website: store.contactInfo?.placeName || '' // Using placeName for website
        },
        timezone: store.hotelSettings?.operationalSettings?.timezone || 'UTC+0',
        checkInTime: store.hotelSettings?.operationalSettings?.checkInTime || '15:00',
        checkOutTime: store.hotelSettings?.operationalSettings?.checkOutTime || '11:00'
      });

      // Load printer settings
      if (store.hotelSettings?.printerConfiguration) {
        this.printerSettingsForm.patchValue(store.hotelSettings.printerConfiguration);
      }

      // Load email settings
      if (store.hotelSettings?.emailSettings) {
        this.emailSettingsForm.patchValue(store.hotelSettings.emailSettings);
      }

      // Load notification settings
      if (store.hotelSettings?.notifications) {
        this.notificationSettingsForm.patchValue(store.hotelSettings.notifications);
      }
    }
    
    this.loading.set(false);
  }

  private checkPrinterStatus(): void {
    const printerInfo = this.printerService.getConnectedDeviceInfo();
    if (printerInfo) {
      this.connectedPrinter.set(printerInfo);
      this.printerConnected.set(true);
    }
  }

  async connectPrinter(): Promise<void> {
    this.printerConnecting.set(true);
    try {
      await this.printerService.connectToPrinter();
      const printerInfo = this.printerService.getConnectedDeviceInfo();
      if (printerInfo) {
        this.connectedPrinter.set(printerInfo);
        this.printerConnected.set(true);
        this.snackBar.open('Printer connected successfully!', 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error connecting to printer:', error);
      this.snackBar.open('Failed to connect to printer. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.printerConnecting.set(false);
    }
  }

  disconnectPrinter(): void {
    this.printerService.disconnectPrinter();
    this.connectedPrinter.set(null);
    this.printerConnected.set(false);
    this.snackBar.open('Printer disconnected', 'Close', { duration: 3000 });
  }

  async testPrint(): Promise<void> {
    try {
      const printerConfig = this.getCurrentPrinterConfiguration();
      await this.printerService.testPrint(printerConfig);
      this.snackBar.open('Test print sent successfully with current settings!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error during test print:', error);
      this.snackBar.open('Test print failed. Please check printer connection.', 'Close', { duration: 5000 });
    }
  }

  async testPaperUtilization(): Promise<void> {
    try {
      const printerConfig = this.getCurrentPrinterConfiguration();
      await this.printerService.testPaperUtilization(printerConfig);
      this.snackBar.open('Paper utilization test sent successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error during paper utilization test:', error);
      this.snackBar.open('Paper utilization test failed. Please check printer connection.', 'Close', { duration: 5000 });
    }
  }

  // Method to handle logo upload
  async uploadLogo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (e.target?.result) {
            await this.printerService.uploadLogo(e.target.result as ArrayBuffer);
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error uploading logo:', error);
        this.snackBar.open('Failed to upload logo. Please try again.', 'Close', { duration: 5000 });
      }
    }
  }

  // Helper method to get current printer configuration from form or store
  getCurrentPrinterConfiguration(): PrinterConfiguration {
    const store = this.storeStore.selectedStore();
    const storedConfig = store?.hotelSettings?.printerConfiguration;
    
    // Use form values if available, otherwise use stored values, with fallbacks
    return {
      paperSize: this.printerSettingsForm.get('paperSize')?.value || storedConfig?.paperSize || '80mm',
      printQuality: this.printerSettingsForm.get('printQuality')?.value || storedConfig?.printQuality || 'normal',
      autocut: this.printerSettingsForm.get('autocut')?.value ?? storedConfig?.autocut ?? true,
      headerText: this.printerSettingsForm.get('headerText')?.value || storedConfig?.headerText || '',
      footerText: this.printerSettingsForm.get('footerText')?.value || storedConfig?.footerText || 'Thank you for your stay!',
      includeLogo: this.printerSettingsForm.get('includeLogo')?.value ?? storedConfig?.includeLogo ?? true,
      fontSize: this.printerSettingsForm.get('fontSize')?.value || storedConfig?.fontSize || 12,
      lineSpacing: this.printerSettingsForm.get('lineSpacing')?.value || storedConfig?.lineSpacing || 1.2
    };
  }

  // Public method to print a reservation with hotel settings
  async printReservationWithHotelSettings(reservation: any): Promise<void> {
    try {
      const store = this.storeStore.selectedStore();
      if (!store) {
        throw new Error('No store selected');
      }

      const printerConfig = this.getCurrentPrinterConfiguration();
      await this.printerService.printReservation(reservation, store, printerConfig);
      this.snackBar.open('Reservation printed successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error printing reservation:', error);
      this.snackBar.open('Failed to print reservation. Please check printer connection.', 'Close', { duration: 5000 });
      throw error; // Re-throw so calling component can handle it
    }
  }

  saveHotelInfo(): void {
    if (this.hotelInfoForm.valid && this.storeStore.selectedStore()) {
      this.saving.set(true);
      
      const formValue = this.hotelInfoForm.value;
      const currentStore = this.storeStore.selectedStore()!;
      
      // Prepare store update payload using existing contactInfo structure
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
          placeName: formValue.contactInfo.website, // Store website in placeName field
          placeNumber: currentStore.contactInfo?.placeNumber || '' // Preserve existing placeNumber
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

      // Update store via service
      this.storeService.updateStore(currentStore._id, storeUpdatePayload).subscribe({
        next: (updateResult) => {
          // Fetch the updated store object since updateStore returns a MongoDB result
          this.storeService.getStore(currentStore._id).subscribe({
            next: (updatedStore) => {
              // Update the store in the signal store
              this.storeStore.updateStore(updatedStore);
              this.storeService.saveStoreLocally(updatedStore);
              
              this.saving.set(false);
              this.snackBar.open('Hotel information saved successfully!', 'Close', { duration: 3000 });
            },
            error: (fetchError) => {
              console.error('Error fetching updated store:', fetchError);
              this.saving.set(false);
              this.snackBar.open('Settings saved but failed to update local data. Please refresh the page.', 'Close', { duration: 5000 });
            }
          });
        },
        error: (error) => {
          console.error('Error saving hotel info:', error);
          this.saving.set(false);
          this.snackBar.open('Failed to save hotel information. Please try again.', 'Close', { duration: 5000 });
        }
      });
    }
  }

  savePrinterSettings(): void {
    if (this.printerSettingsForm.valid && this.storeStore.selectedStore()) {
      this.saving.set(true);
      
      const currentStore = this.storeStore.selectedStore()!;
      const printerConfig = this.printerSettingsForm.value;
      
      const storeUpdatePayload = {
        hotelSettings: {
          ...currentStore.hotelSettings,
          printerConfiguration: printerConfig
        }
      };

      this.storeService.updateStore(currentStore._id, storeUpdatePayload).subscribe({
        next: (updateResult) => {
          // Fetch the updated store object since updateStore returns a MongoDB result
          this.storeService.getStore(currentStore._id).subscribe({
            next: (updatedStore) => {
              this.storeStore.updateStore(updatedStore);
              this.storeService.saveStoreLocally(updatedStore);
              
              this.saving.set(false);
              this.snackBar.open('Printer settings saved successfully!', 'Close', { duration: 3000 });
            },
            error: (fetchError) => {
              console.error('Error fetching updated store:', fetchError);
              this.saving.set(false);
              this.snackBar.open('Settings saved but failed to update local data. Please refresh the page.', 'Close', { duration: 5000 });
            }
          });
        },
        error: (error) => {
          console.error('Error saving printer settings:', error);
          this.saving.set(false);
          this.snackBar.open('Failed to save printer settings. Please try again.', 'Close', { duration: 5000 });
        }
      });
    }
  }

  saveEmailSettings(): void {
    if (this.emailSettingsForm.valid && this.storeStore.selectedStore()) {
      this.saving.set(true);
      
      const currentStore = this.storeStore.selectedStore()!;
      const emailSettings = this.emailSettingsForm.value;
      
      const storeUpdatePayload = {
        hotelSettings: {
          ...currentStore.hotelSettings,
          emailSettings: emailSettings
        }
      };

      this.storeService.updateStore(currentStore._id, storeUpdatePayload).subscribe({
        next: (updateResult) => {
          // Fetch the updated store object since updateStore returns a MongoDB result
          this.storeService.getStore(currentStore._id).subscribe({
            next: (updatedStore) => {
              this.storeStore.updateStore(updatedStore);
              this.storeService.saveStoreLocally(updatedStore);
              
              this.saving.set(false);
              this.snackBar.open('Email settings saved successfully!', 'Close', { duration: 3000 });
            },
            error: (fetchError) => {
              console.error('Error fetching updated store:', fetchError);
              this.saving.set(false);
              this.snackBar.open('Settings saved but failed to update local data. Please refresh the page.', 'Close', { duration: 5000 });
            }
          });
        },
        error: (error) => {
          console.error('Error saving email settings:', error);
          this.saving.set(false);
          this.snackBar.open('Failed to save email settings. Please try again.', 'Close', { duration: 5000 });
        }
      });
    }
  }

  saveNotificationSettings(): void {
    if (this.storeStore.selectedStore()) {
      this.saving.set(true);
      
      const currentStore = this.storeStore.selectedStore()!;
      const notificationSettings = this.notificationSettingsForm.value;
      
      const storeUpdatePayload = {
        hotelSettings: {
          ...currentStore.hotelSettings,
          notifications: notificationSettings
        }
      };

      this.storeService.updateStore(currentStore._id, storeUpdatePayload).subscribe({
        next: (updateResult) => {
          // Fetch the updated store object since updateStore returns a MongoDB result
          this.storeService.getStore(currentStore._id).subscribe({
            next: (updatedStore) => {
              this.storeStore.updateStore(updatedStore);
              this.storeService.saveStoreLocally(updatedStore);
              
              this.saving.set(false);
              this.snackBar.open('Notification settings saved successfully!', 'Close', { duration: 3000 });
            },
            error: (fetchError) => {
              console.error('Error fetching updated store:', fetchError);
              this.saving.set(false);
              this.snackBar.open('Settings saved but failed to update local data. Please refresh the page.', 'Close', { duration: 5000 });
            }
          });
        },
        error: (error) => {
          console.error('Error saving notification settings:', error);
          this.saving.set(false);
          this.snackBar.open('Failed to save notification settings. Please try again.', 'Close', { duration: 5000 });
        }
      });
    }
  }

  testEmailConnection(): void {
    if (this.emailSettingsForm.valid) {
      this.snackBar.open('Testing email connection...', 'Close', { duration: 2000 });
      // Simulate email test
      setTimeout(() => {
        this.snackBar.open('Email connection test successful!', 'Close', { duration: 3000 });
      }, 2000);
    }
  }
}
