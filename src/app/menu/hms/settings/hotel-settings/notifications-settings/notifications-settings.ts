import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StoreStore } from '../../../../../shared/stores/store.store';
import { StoreService } from '../../../../../shared/services/store.service';

@Component({
  selector: 'app-notifications-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './notifications-settings.html',
  styleUrl: './notifications-settings.scss',
})
export class NotificationsSettings implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private storeService = inject(StoreService);
  public storeStore = inject(StoreStore);

  loading = signal(false);
  saving = signal(false);
  
  notificationSettingsForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
    this.loadSettings();
  }

  private initializeForm(): void {
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
    if (store?.hotelSettings?.notifications) {
      this.notificationSettingsForm.patchValue(store.hotelSettings.notifications);
    }
    
    this.loading.set(false);
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
        next: () => {
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
              this.snackBar.open('Settings saved but failed to update local data.', 'Close', { duration: 5000 });
            }
          });
        },
        error: (error) => {
          console.error('Error saving notification settings:', error);
          this.saving.set(false);
          this.snackBar.open('Failed to save notification settings.', 'Close', { duration: 5000 });
        }
      });
    }
  }
}
