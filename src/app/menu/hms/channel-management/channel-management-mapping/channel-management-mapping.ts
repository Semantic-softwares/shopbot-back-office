import { Component, computed, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { StoreStore } from '../../../../shared/stores/store.store';
import { ChannexService, ChannexStatusResponse } from '../../../../shared/services/channex.service';
import { RoomsService } from '../../../../shared/services/rooms.service';
import { RoomType } from '../../../../shared/models/room.model';
import { SanitizeUrlPipe } from '../../../../shared/pipes/sanitize-url.pipe';
import { PageHeaderComponent } from "../../../../shared/components/page-header/page-header.component";
import { MatListModule } from "@angular/material/list";
import { MatDialogClose } from "@angular/material/dialog";

type StepStatus = 'pending' | 'in-progress' | 'completed' | 'error';

interface SetupStep {
  id: number;
  title: string;
  description: string;
  status: StepStatus;
  icon: string;
  errorMessage?: string;
}

@Component({
  selector: 'app-channel-management-mapping',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatStepperModule,
    MatExpansionModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule, SanitizeUrlPipe, SanitizeUrlPipe,
    PageHeaderComponent,
    MatListModule,
    MatDialogClose
],
  providers: [provideNativeDateAdapter()],
  templateUrl: './channel-management-mapping.html',
  styleUrl: './channel-management-mapping.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelManagementMapping implements OnInit {
  private storeStore = inject(StoreStore);
  private channexService = inject(ChannexService);
  private roomsService = inject(RoomsService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // Store data
  protected selectedStore = this.storeStore.selectedStore;
  protected storeId = computed(() => this.selectedStore()?._id || '');
  protected storeName = computed(() => this.selectedStore()?.name || '');
  protected storeType = computed(() => this.selectedStore()?.storeType || 'restaurant');
  protected propertyType = computed(() => this.selectedStore()?.propertyType || 'hotel');
  protected isHotelProperty = computed(() => {
    const propType = this.propertyType();
    return propType === 'hotel' || propType === 'resort' || propType === 'boutique_hotel' || 
           propType === 'motel' || propType === 'hostel' || propType === 'guesthouse' || 
           propType === 'villa' || propType === 'bed_and_breakfast' || propType === 'lodge' || 
           propType === 'apartment';
  });

  // Setup state
  protected setupSteps = signal<SetupStep[]>([
    {
      id: 1,
      title: 'Sync Property',
      description: 'Register your hotel with Channex',
      status: 'pending',
      icon: 'hotel',
    },
    {
      id: 2,
      title: 'Sync Room Types',
      description: 'Map your room types to distribution channels',
      status: 'pending',
      icon: 'meeting_room',
    },
    {
      id: 3,
      title: 'Push Availability',
      description: 'Send your availability and rates',
      status: 'pending',
      icon: 'event_available',
    },
    {
      id: 4,
      title: 'Connect Channels',
      description: 'Link to Booking.com, Airbnb, etc.',
      status: 'pending',
      icon: 'link',
    },
  ]);

  protected currentStep = signal(0);
  protected channexStatus = signal<ChannexStatusResponse['data'] | null>(null);
  protected roomTypes = signal<RoomType[]>([]);
  protected isLoadingStatus = signal(false);
  protected channelIframeUrl = signal<string | null>(null);
  protected isLoadingIframe = signal(false);
  protected isSetupComplete = computed(() => {
    const status = this.channexStatus();
    return status?.channex?.syncStatus === 'synced' && 
           status?.roomMappings && 
           status.roomMappings.length > 0;
  });

  // Forms
  protected syncPropertyForm: FormGroup;
  protected availabilityForm: FormGroup;

  // Computed states
  protected isSyncingStore = this.channexService.isSyncingStore;
  protected isPushingAvailability = this.channexService.isPushingAvailability;

  constructor() {
    // Initialize forms
    this.syncPropertyForm = this.fb.group({
      propertyType: [this.propertyType() || 'hotel', Validators.required],
      checkInTime: ['15:00', Validators.required],
      checkOutTime: ['11:00', Validators.required],
    });

    const today = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(today.getFullYear() + 1);

    this.availabilityForm = this.fb.group({
      startDate: [today, Validators.required],
      endDate: [oneYearLater, Validators.required],
    });
  }

  ngOnInit(): void {
    // Restore cached UI state if available to reduce perceived flicker on refresh
    this.restoreCachedState();

    // Always load fresh data from server and update cache
    this.loadChannexStatus();
    this.loadRoomTypes();
  }

  /**
   * Handle stepper selection changes: persist step and auto-open iframe on step 4
   */
  protected onStepSelectionChange(event: any): void {
    const idx = event?.selectedIndex ?? 0;
    this.setCurrentStep(idx);

    // If user navigated to Step 4 (index 3) and there are connected channels, auto-open iframe
    if (idx === 3) {
      const connected = this.channexStatus()?.channex?.connectedChannels;
      if (connected && connected.length > 0 && !this.channelIframeUrl()) {
        this.connectChannels();
      }
    }
  }

  /**
   * Load current Channex status
   */
  protected loadChannexStatus(): void {
    const storeId = this.storeId();
    if (!storeId) return;

    this.isLoadingStatus.set(true);
    
    this.channexService.getStoreStatus(storeId).subscribe({
      next: (response) => {
        this.channexStatus.set(response.data);
        // Cache status for quick restore on refresh
        try {
          localStorage.setItem(`channexStatus:${storeId}`, JSON.stringify(response.data));
        } catch (e) {
          // ignore quota issues
        }
        this.updateStepsBasedOnStatus(response.data);
        // If user is currently on Step 4 and there are connected channels, auto-open iframe
        try {
          const idx = this.currentStep();
          const connected = response.data.channex?.connectedChannels;
          if (idx === 3 && connected && connected.length > 0 && !this.channelIframeUrl()) {
            this.connectChannels();
          }
        } catch (e) {
          // ignore
        }
        this.isLoadingStatus.set(false);
      },
      error: (error) => {
        console.error('Failed to load Channex status:', error);
        this.isLoadingStatus.set(false);
        this.showError('Failed to load channel management status');
      },
    });
  }

  /**
   * Load room types
   */
  protected loadRoomTypes(): void {
    const storeId = this.storeId();
    if (!storeId) return;

    this.roomsService.getRoomTypes(storeId).subscribe({
      next: (roomTypes) => {
        this.roomTypes.set(roomTypes);
      },
      error: (error) => {
        console.error('Failed to load room types:', error);
      },
    });
  }

  /**
   * Update setup steps based on current status
   */
  private updateStepsBasedOnStatus(status: ChannexStatusResponse['data']): void {
    const steps = this.setupSteps();

    // Step 1: Property sync
    if (status.channex?.syncStatus === 'synced') {
      steps[0].status = 'completed';
      this.setCurrentStepIfHigher(1);
    } else if (status.channex?.syncStatus === 'error') {
      steps[0].status = 'error';
      steps[0].errorMessage = 'Sync failed. Please try again.';
    }

    // Step 2: Room types sync
    if (status.roomMappings && status.roomMappings.length > 0) {
      steps[1].status = 'completed';
      this.setCurrentStepIfHigher(2);
    }

    // Step 3: Availability (assume completed if room types are synced)
    if (status.roomMappings && status.roomMappings.length > 0) {
      steps[2].status = 'completed';
      this.setCurrentStepIfHigher(3);
    }

    this.setupSteps.set([...steps]);
  }

  /**
   * Persist current step index to localStorage
   */
  protected setCurrentStep(index: number): void {
    this.currentStep.set(index);
    try {
      const storeId = this.storeId();
      if (storeId) localStorage.setItem(`channelStepper:${storeId}`, String(index));
    } catch (e) {}
  }

  /**
   * Set current step only if the provided index is higher than the existing one
   */
  private setCurrentStepIfHigher(index: number): void {
    const current = this.currentStep();
    if (index > current) this.setCurrentStep(index);
  }

  /**
   * Restore cached channex status and step index from localStorage (if any)
   */
  private restoreCachedState(): void {
    const storeId = this.storeId();
    if (!storeId) return;

    try {
      const cached = localStorage.getItem(`channexStatus:${storeId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        this.channexStatus.set(parsed);
        this.updateStepsBasedOnStatus(parsed);
      }

      const step = localStorage.getItem(`channelStepper:${storeId}`);
      if (step !== null) {
        const idx = Number(step);
        if (!isNaN(idx)) this.setCurrentStep(idx);
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * Sync store to Channex
   */
  protected syncStore(): void {
    const storeId = this.storeId();
    if (!storeId || this.syncPropertyForm.invalid) return;

    // Validate property type
    if (!this.isHotelProperty()) {
      this.showError('Please set a valid property type (hotel, resort, etc.) to sync with Channex.');
      return;
    }

    this.updateStepStatus(0, 'in-progress');

    const formData = this.syncPropertyForm.value;
    
    this.channexService.syncStoreToChannex(storeId, formData).subscribe({
      next: (response) => {
        this.updateStepStatus(0, 'completed');
        // Update the store record on the backend with new property type and hotel settings
        const updatePayload: Partial<any> = {
          propertyType: formData.propertyType,
          hotelSettings: {
            ...(this.selectedStore()?.hotelSettings || {}),
            operationalSettings: {
              ...(this.selectedStore()?.hotelSettings?.operationalSettings || {}),
              checkInTime: formData.checkInTime,
              checkOutTime: formData.checkOutTime,
            }
          },
          // store channex info returned from sync API if available
          channex: {
            propertyId: response?.store?.channexPropertyId || this.channexStatus()?.channex?.propertyId,
            syncStatus: 'synced',
            lastSyncAt: new Date().toISOString()
          }
        };

        // Call store store update (this will persist locally via StoreStore)
        try {
          // rxMethod is invoked directly; it manages its own observable lifecycle internally
          this.storeStore.updateStore$(updatePayload);
        } catch (e) {
          console.error('Failed to invoke store update:', e);
        }

        // Advance UI and refresh status regardless — store update will persist asynchronously
        this.setCurrentStep(1);
        this.showSuccess(response.message);
        this.loadChannexStatus(); // Reload status
      },
      error: (error) => {
        this.updateStepStatus(0, 'error', error.error?.message || 'Failed to sync property');
        this.showError(error.error?.message || 'Failed to sync property to Channex');
      },
    });
  }

  /**
   * Sync a specific room type
   */
  protected syncRoomType(roomTypeId: string, roomTypeName: string): void {
    const storeId = this.storeId();
    if (!storeId) return;

    this.channexService.syncRoomTypeToChannex(storeId, roomTypeId, {}).subscribe({
      next: (response) => {
        this.showSuccess(`${roomTypeName} synced successfully`);
        this.loadChannexStatus(); // Reload to get updated mappings
      },
      error: (error) => {
        this.showError(error.error?.message || `Failed to sync ${roomTypeName}`);
      },
    });
  }

  /**
   * Sync all room types
   */
  protected syncAllRoomTypes(): void {
    const storeId = this.storeId();
    const roomTypes = this.roomTypes();
    
    if (!storeId || roomTypes.length === 0) return;

    this.updateStepStatus(1, 'in-progress');

    let completedCount = 0;
    let errorCount = 0;

    roomTypes.forEach((roomType) => {
      this.channexService.syncRoomTypeToChannex(storeId, roomType._id || roomType.id || '', {}).subscribe({
        next: () => {
          completedCount++;
          if (completedCount + errorCount === roomTypes.length) {
            this.handleAllRoomTypesSynced(completedCount, errorCount);
          }
        },
        error: () => {
          errorCount++;
          if (completedCount + errorCount === roomTypes.length) {
            this.handleAllRoomTypesSynced(completedCount, errorCount);
          }
        },
      });
    });
  }

  /**
   * Handle completion of all room types sync
   */
  private handleAllRoomTypesSynced(completedCount: number, errorCount: number): void {
    if (errorCount === 0) {
      this.updateStepStatus(1, 'completed');
      this.setCurrentStep(2);
      this.showSuccess(`All ${completedCount} room types synced successfully`);
    } else {
      this.updateStepStatus(1, 'error', `${errorCount} room types failed to sync`);
      this.showError(`${completedCount} synced, ${errorCount} failed`);
    }
    this.loadChannexStatus();
  }

  /**
   * Push availability to Channex
   */
  protected pushAvailability(): void {
    const storeId = this.storeId();
    if (!storeId || this.availabilityForm.invalid) return;

    this.updateStepStatus(2, 'in-progress');

    const startDate = this.availabilityForm.value.startDate as Date;
    const endDate = this.availabilityForm.value.endDate as Date;

    const data = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };

    this.channexService.pushAvailability(storeId, data).subscribe({
      next: (response) => {
        this.updateStepStatus(2, 'completed');
        this.setCurrentStep(3);
        this.showSuccess(response.message);
      },
      error: (error) => {
        this.updateStepStatus(2, 'error', error.error?.message || 'Failed to push availability');
        this.showError(error.error?.message || 'Failed to push availability');
      },
    });
  }

  /**
   * Get channel connection key and display iframe
   */
  protected connectChannels(): void {
    const storeId = this.storeId();
    if (!storeId) return;

    this.isLoadingIframe.set(true);
    this.updateStepStatus(3, 'in-progress');

    this.channexService.getChannelConnectionKey(storeId).subscribe({
      next: (response) => {
        console.log(response.data.iframeUrl)
        this.channelIframeUrl.set(response.data.iframeUrl);
        this.isLoadingIframe.set(false);
        this.showSuccess('Channel connection interface loaded');
      },
      error: (error) => {
        this.isLoadingIframe.set(false);
        this.updateStepStatus(3, 'error', error.error?.message || 'Failed to load channel connection');
        this.showError(error.error?.message || 'Failed to load channel connection');
      },
    });
  }

  /**
   * Handle iframe messages from Channex
   */
  protected onIframeLoad(): void {
    // Listen for messages from the iframe
    window.addEventListener('message', (event) => {
      // Verify origin is from Channex
      if (!event.origin.includes('channex.io')) return;

      const data = event.data;
      
      // Handle different message types from Channex iframe
      if (data.type === 'channel_connected') {
        this.handleChannelConnected(data);
      } else if (data.type === 'channel_disconnected') {
        this.handleChannelDisconnected(data);
      } else if (data.type === 'iframe_ready') {
        console.log('Channex iframe ready');
      }
    });
  }

  /**
   * Handle channel connection from iframe
   */
  private handleChannelConnected(data: any): void {
    this.showSuccess(`${data.channelName || 'Channel'} connected successfully`);
    this.loadChannexStatus(); // Refresh status
  }

  /**
   * Handle channel disconnection from iframe
   */
  private handleChannelDisconnected(data: any): void {
    this.showSuccess(`${data.channelName || 'Channel'} disconnected`);
    this.loadChannexStatus(); // Refresh status
  }

  /**
   * Close iframe
   */
  protected closeIframe(): void {
    this.channelIframeUrl.set(null);
    this.loadChannexStatus(); // Refresh status after closing
  }

  /**
   * Check if room type is syncing
   */
  protected isRoomTypeSyncing(roomTypeId: string): boolean {
    return this.channexService.isRoomTypeSyncing(roomTypeId);
  }

  /**
   * Check if room type is already synced
   */
  protected isRoomTypeSynced(roomTypeId: string): boolean {
    const status = this.channexStatus();
    if (!status?.roomMappings) return false;
    
    return status.roomMappings.some(
      mapping => mapping.roomType._id === roomTypeId
    );
  }

  /**
   * Update step status
   */
  private updateStepStatus(stepIndex: number, status: StepStatus, errorMessage?: string): void {
    const steps = this.setupSteps();
    steps[stepIndex].status = status;
    if (errorMessage) {
      steps[stepIndex].errorMessage = errorMessage;
    }
    this.setupSteps.set([...steps]);
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 7000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  /**
   * Get step icon based on status
   */
  protected getStepIcon(step: SetupStep): string {
    switch (step.status) {
      case 'completed':
        return 'check_circle';
      case 'in-progress':
        return 'sync';
      case 'error':
        return 'error';
      default:
        return step.icon;
    }
  }

  /**
   * Get step icon color
   */
  protected getStepIconColor(step: SetupStep): string {
    switch (step.status) {
      case 'completed':
        return 'text-green-600';
      case 'in-progress':
        return 'text-blue-600 animate-spin';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  }
}
