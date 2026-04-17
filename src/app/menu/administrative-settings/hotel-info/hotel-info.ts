import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SubscriptionService } from '../../../shared/services/subscription.service';
import { RolesService } from '../../../shared/services/roles.service';
import { SessionStorageService } from '../../../shared/services/session-storage.service';
import { StoreService } from '../../../shared/services/store.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PinAuthorizationDialogComponent, PinAuthorizationDialogResult } from '../../hms/front-desk/reservations/pin-authorization-dialog/pin-authorization-dialog.component';


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
    MatListModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './hotel-info.html',
  styleUrl: './hotel-info.scss',
})
export class HotelInfo implements OnInit {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private rolesService = inject(RolesService);
  private sessionStorageService = inject(SessionStorageService);
  private storeService = inject(StoreService);
  private subscriptionService = inject(SubscriptionService);
  public storeStore = inject(StoreStore);

  loading = signal(false);
  saving = signal(false);
  resetting = signal(false);
  resettingPms = signal(false);
  resettingErp = signal(false);

  readonly emsResetItems: Array<{ key: string; label: string; description: string }> = [
    { key: 'leases', label: 'Leases', description: 'Delete all lease records for this store.' },
    { key: 'properties', label: 'Properties', description: 'Delete all property records.' },
    { key: 'units', label: 'Units', description: 'Delete all unit records.' },
    { key: 'tenants', label: 'Tenants', description: 'Delete all tenant profiles.' },
    { key: 'rentalOwners', label: 'Rental Owners', description: 'Delete all rental owner records.' },
    { key: 'invoices', label: 'Invoices', description: 'Delete all EMS invoices.' },
    { key: 'payments', label: 'Payments', description: 'Delete all EMS payment records.' },
    { key: 'receipts', label: 'Receipts', description: 'Delete all EMS receipt records.' },
    { key: 'allocations', label: 'Allocations', description: 'Delete all payment allocation records.' },
    { key: 'vehicles', label: 'Vehicles', description: 'Delete all tenant vehicle records.' },
    { key: 'pets', label: 'Pets', description: 'Delete all tenant pet records.' },
    { key: 'maintenanceVendors', label: 'Maintenance Vendors', description: 'Delete all maintenance vendor records.' },
    { key: 'maintenanceRequests', label: 'Maintenance Requests', description: 'Delete all maintenance request records.' },
    { key: 'maintenanceActivities', label: 'Maintenance Activities', description: 'Delete all maintenance activity logs.' },
  ];

  readonly pmsResetItems: Array<{ key: string; label: string; description: string }> = [
    { key: 'reservations', label: 'Reservations', description: 'Delete all reservation records for this store.' },
    { key: 'reservationTransactions', label: 'Reservation Transactions', description: 'Delete all reservation payment/refund transactions.' },
    { key: 'guests', label: 'Guests', description: 'Delete all guest profiles linked to this store.' },
    { key: 'rooms', label: 'Rooms', description: 'Delete all room records.' },
    { key: 'roomTypes', label: 'Room Types', description: 'Delete all room type records.' },
    { key: 'rateInventories', label: 'Rate Inventory', description: 'Delete all per-date inventory and rates.' },
    { key: 'ratePlans', label: 'Rate Plans', description: 'Delete all configured rate plans.' },
    { key: 'channexRoomMappings', label: 'Channex Room Mappings', description: 'Delete all PMS-to-Channex room type mappings.' },
  ];

  readonly erpResetItems: Array<{ key: string; label: string; description: string }> = [
    { key: 'foods', label: 'Foods / Products', description: 'Delete all product records for this store.' },
    { key: 'menus', label: 'Menus', description: 'Delete all menu records.' },
    { key: 'offers', label: 'Offers', description: 'Delete all offer/promo records linked to products or menus.' },
    { key: 'optionGroups', label: 'Option Groups', description: 'Delete all option groups.' },
    { key: 'optionItems', label: 'Option Items', description: 'Delete all option items.' },
    { key: 'suppliers', label: 'Suppliers', description: 'Delete all supplier records.' },
    { key: 'restocks', label: 'Restocks', description: 'Delete all inventory restock records.' },
  ];

  selectedResetTargets = signal<string[]>([]);
  selectedPmsResetTargets = signal<string[]>([]);
  selectedErpResetTargets = signal<string[]>([]);
  
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
    this.subscriptionService.getSubscriptionWithModules().subscribe({
      next: () => {
        this.refreshModuleVisibility();
      },
      error: () => {
        // Keep current visibility if modules cannot be loaded.
      },
    });
  }

  readonly canManageReset = signal(false);

  readonly hasEmsModule = signal(false);
  readonly hasPmsModule = signal(false);
  readonly hasErpModule = signal(false);

  private refreshModuleVisibility(): void {
    const activeModuleKeys = this.subscriptionService.activeModuleKeys();
    this.hasEmsModule.set(activeModuleKeys.includes('EMS'));
    this.hasPmsModule.set(activeModuleKeys.includes('PMS'));
    this.hasErpModule.set(activeModuleKeys.includes('ERP'));
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
      const currentUserId = this.sessionStorageService.getCurrentUser()?._id;
      const ownerId = typeof store.owner === 'string' ? store.owner : store.owner?._id;
      const isOwner = !!ownerId && !!currentUserId && ownerId === currentUserId;
      const isAdmin = this.rolesService.isAdmin();
      this.canManageReset.set(isAdmin || isOwner);

      this.refreshModuleVisibility();

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

  isTargetSelected(target: string): boolean {
    return this.selectedResetTargets().includes(target);
  }

  onTargetToggle(target: string, checked: boolean): void {
    this.selectedResetTargets.update((current) => {
      if (checked) {
        if (current.includes(target)) {
          return current;
        }
        return [...current, target];
      }
      return current.filter((item) => item !== target);
    });
  }

  onSelectionListChange(selectionList: MatSelectionList): void {
    const selected = selectionList.selectedOptions.selected.map((option) => String(option.value));
    this.selectedResetTargets.set(selected);
  }

  canResetSelection(): boolean {
    return this.selectedResetTargets().length > 0 && !this.resetting();
  }

  isPmsTargetSelected(target: string): boolean {
    return this.selectedPmsResetTargets().includes(target);
  }

  onPmsSelectionListChange(selectionList: MatSelectionList): void {
    const selected = selectionList.selectedOptions.selected.map((option) => String(option.value));
    this.selectedPmsResetTargets.set(selected);
  }

  canResetPmsSelection(): boolean {
    return this.selectedPmsResetTargets().length > 0 && !this.resettingPms();
  }

  isErpTargetSelected(target: string): boolean {
    return this.selectedErpResetTargets().includes(target);
  }

  onErpSelectionListChange(selectionList: MatSelectionList): void {
    const selected = selectionList.selectedOptions.selected.map((option) => String(option.value));
    this.selectedErpResetTargets.set(selected);
  }

  canResetErpSelection(): boolean {
    return this.selectedErpResetTargets().length > 0 && !this.resettingErp();
  }

  confirmAndResetEmsData(): void {
    const store = this.storeStore.selectedStore();
    const targets = this.selectedResetTargets();

    if (!store?._id || targets.length === 0 || this.resetting()) {
      return;
    }

    const pinRef = this.dialog.open(PinAuthorizationDialogComponent, {
      width: '420px',
      disableClose: true,
      data: {
        storeId: store._id,
        reservationId: '',
        actionDescription: 'reset selected EMS account data',
      },
    });

    pinRef.afterClosed().subscribe((result: PinAuthorizationDialogResult | undefined) => {
      if (!result?.authorized || !result.pin) {
        return;
      }

      this.resetting.set(true);
      this.storeService
        .resetEmsAccountData(store._id, { pin: result.pin, targets })
        .subscribe({
          next: (response) => {
            this.resetting.set(false);
            this.selectedResetTargets.set([]);
            this.snackBar.open(response.message || 'Selected EMS data reset successfully.', 'Close', {
              duration: 4500,
            });
          },
          error: (error) => {
            this.resetting.set(false);
            const message = error?.error?.message || 'Failed to reset selected EMS data.';
            this.snackBar.open(message, 'Close', { duration: 5000 });
          },
        });
    });
  }

  confirmAndResetPmsData(): void {
    const store = this.storeStore.selectedStore();
    const targets = this.selectedPmsResetTargets();

    if (!store?._id || targets.length === 0 || this.resettingPms()) {
      return;
    }

    const pinRef = this.dialog.open(PinAuthorizationDialogComponent, {
      width: '420px',
      disableClose: true,
      data: {
        storeId: store._id,
        reservationId: '',
        actionDescription: 'reset selected PMS account data',
      },
    });

    pinRef.afterClosed().subscribe((result: PinAuthorizationDialogResult | undefined) => {
      if (!result?.authorized || !result.pin) {
        return;
      }

      this.resettingPms.set(true);
      this.storeService
        .resetPmsAccountData(store._id, { pin: result.pin, targets })
        .subscribe({
          next: (response) => {
            this.resettingPms.set(false);
            this.selectedPmsResetTargets.set([]);
            this.snackBar.open(response.message || 'Selected PMS data reset successfully.', 'Close', {
              duration: 4500,
            });
          },
          error: (error) => {
            this.resettingPms.set(false);
            const message = error?.error?.message || 'Failed to reset selected PMS data.';
            this.snackBar.open(message, 'Close', { duration: 5000 });
          },
        });
    });
  }

  confirmAndResetErpData(): void {
    const store = this.storeStore.selectedStore();
    const targets = this.selectedErpResetTargets();

    if (!store?._id || targets.length === 0 || this.resettingErp()) {
      return;
    }

    const pinRef = this.dialog.open(PinAuthorizationDialogComponent, {
      width: '420px',
      disableClose: true,
      data: {
        storeId: store._id,
        reservationId: '',
        actionDescription: 'reset selected ERP account data',
      },
    });

    pinRef.afterClosed().subscribe((result: PinAuthorizationDialogResult | undefined) => {
      if (!result?.authorized || !result.pin) {
        return;
      }

      this.resettingErp.set(true);
      this.storeService
        .resetErpAccountData(store._id, { pin: result.pin, targets })
        .subscribe({
          next: (response) => {
            this.resettingErp.set(false);
            this.selectedErpResetTargets.set([]);
            this.snackBar.open(response.message || 'Selected ERP data reset successfully.', 'Close', {
              duration: 4500,
            });
          },
          error: (error) => {
            this.resettingErp.set(false);
            const message = error?.error?.message || 'Failed to reset selected ERP data.';
            this.snackBar.open(message, 'Close', { duration: 5000 });
          },
        });
    });
  }
}
