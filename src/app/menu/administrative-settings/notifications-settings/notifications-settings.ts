import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StoreService } from '../../../shared/services/store.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { SubscriptionService } from '../../../shared/services/subscription.service';
import { SubscriptionWithModules, ModuleKey } from '../../../shared/models/subscription.model';

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
  private subscriptionDetails = signal<SubscriptionWithModules | null>(null);

  private readonly activeModuleKeys = computed<ModuleKey[]>(() => {
    const details = this.subscriptionDetails();
    if (!details) return [];
    return details.modules
      .filter((m) => m.status === 'ACTIVE')
      .map((m) => m.moduleKey);
  });

  readonly hasPms = computed<boolean>(() => this.activeModuleKeys().includes('PMS'));
  readonly hasEms = computed<boolean>(() => this.activeModuleKeys().includes('EMS'));
  
  notificationSettingsForm!: FormGroup;
  emsNotificationSettingsForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
    this.loadSettings();
    this.loadSubscription();
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

  private loadSubscription(): void {
    this.subscriptionService.getSubscriptionWithModules().subscribe({
      next: (data: SubscriptionWithModules) => this.subscriptionDetails.set(data),
      error: () => {},
    });
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
            this.snackBar.open('Notification settings saved successfully!', 'Close', { duration: 3000 });
          },
          error: (fetchError) => {
            console.error('Error fetching updated store:', fetchError);
            this.saving.set(false);
            this.snackBar.open('Settings saved but failed to update local data.', 'Close', { duration: 5000 });
          },
        });
      },
      error: (error) => {
        console.error('Error saving notification settings:', error);
        this.saving.set(false);
        this.snackBar.open('Failed to save notification settings.', 'Close', { duration: 5000 });
      },
    });
  }
}
