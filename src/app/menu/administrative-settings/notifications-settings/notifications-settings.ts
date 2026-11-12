import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StoreService } from '../../../shared/services/store.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { SubscriptionService } from '../../../shared/services/subscription.service';

@Component({
  selector: 'app-notifications-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './notifications-settings.html',
  styleUrl: './notifications-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsSettings implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private storeService = inject(StoreService);
  private subscriptionService = inject(SubscriptionService);
  public storeStore = inject(StoreStore);

  loading = signal<boolean>(false);
  saving = signal<boolean>(false);

  private readonly activeModuleKeys = this.subscriptionService.activeModuleKeys;

  readonly hasPms = computed<boolean>(() => this.activeModuleKeys().includes('PMS'));
  readonly hasEms = computed<boolean>(() => this.activeModuleKeys().includes('EMS'));
  
  /** Hours of the day for the reminder pickers: 00:00 to 23:00. */
  readonly hours = Array.from({ length: 24 }, (_, h) => ({ value: h, label: `${String(h).padStart(2, '0')}:00` }));

  /** The two owner emails; both on unless the store switched them off. Saved as soon as a switch is flipped. */
  readonly ownerEmails = computed(() => {
    const r = (this.storeStore.selectedStore() as any)?.emailReports;
    return { registerClosed: r?.registerClosed !== false, weeklySummary: r?.weeklySummary !== false };
  });

  setOwnerEmail(key: 'registerClosed' | 'weeklySummary', on: boolean): void {
    const store = this.storeStore.selectedStore();
    if (!store) return;
    this.saving.set(true);
    this.persistStoreUpdate(store._id, { emailReports: { ...this.ownerEmails(), [key]: on } });
  }

  notificationSettingsForm!: FormGroup;
  emsNotificationSettingsForm!: FormGroup;

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
      pushNotifications: [true],
      unpaidRoomOrdersAlert: [true],
      unpaidRoomOrdersEveHour: [17],
      unpaidRoomOrdersMorningHour: [8],
    });

    this.emsNotificationSettingsForm = this.fb.group({
      // Tenant Notifications
      leaseExpiryReminder: [true],
      rentDueReminder: [true],
      rentPaymentConfirmation: [true],
      maintenanceRequestUpdate: [true],
      moveInInstructions: [true],
      moveOutReminder: [true],
      leaseRenewalNotice: [true],
      // Property Owner Notifications
      ownerRentCollection: [true],
      ownerMaintenanceAlert: [true],
      ownerVacancyAlert: [true],
      ownerLeaseExpiry: [true],
      ownerMonthlyReport: [false],
      ownerPropertyInspection: [true],
      // Staff / Team Notifications
      staffMaintenanceAssigned: [true],
      staffInspectionScheduled: [true],
      staffTenantComplaint: [true],
      staffLeaseAction: [true],
      // Communication Channels
      smsNotifications: [false],
      pushNotifications: [true],
    });
  }

  private loadSettings(): void {
    this.loading.set(true);
    
    const store = this.storeStore.selectedStore();
    if (store?.hotelSettings?.notifications) {
      this.notificationSettingsForm.patchValue(store.hotelSettings.notifications);
    }
    if (store?.emsSettings?.notifications) {
      this.emsNotificationSettingsForm.patchValue(store.emsSettings.notifications);
    }
    
    this.loading.set(false);
  }

  savePmsNotificationSettings(): void {
    const currentStore = this.storeStore.selectedStore();
    if (!currentStore) return;

    this.saving.set(true);
    const payload = {
      hotelSettings: {
        ...currentStore.hotelSettings,
        notifications: this.notificationSettingsForm.value,
      },
    };
    this.persistStoreUpdate(currentStore._id, payload);
  }

  saveEmsNotificationSettings(): void {
    const currentStore = this.storeStore.selectedStore();
    if (!currentStore) return;

    this.saving.set(true);
    const payload = {
      emsSettings: {
        ...(currentStore as any).emsSettings,
        notifications: this.emsNotificationSettingsForm.value,
      },
    };
    this.persistStoreUpdate(currentStore._id, payload);
  }

  private persistStoreUpdate(storeId: string, payload: Record<string, any>): void {
    this.storeService.updateStore(storeId, payload).subscribe({
      next: () => {
        this.storeService.getStore(storeId).subscribe({
          next: (updatedStore) => {
            this.storeStore.updateStore(updatedStore);
            this.storeService.saveStoreLocally(updatedStore);
            this.saving.set(false);
            this.snackBar.open($localize`Notification settings saved successfully!`, $localize`Close`, { duration: 3000 });
          },
          error: (fetchError) => {
            console.error('Error fetching updated store:', fetchError);
            this.saving.set(false);
            this.snackBar.open($localize`Settings saved but failed to update local data.`, $localize`Close`, { duration: 5000 });
          },
        });
      },
      error: (error) => {
        console.error('Error saving notification settings:', error);
        this.saving.set(false);
        this.snackBar.open($localize`Failed to save notification settings.`, $localize`Close`, { duration: 5000 });
      },
    });
  }
}
