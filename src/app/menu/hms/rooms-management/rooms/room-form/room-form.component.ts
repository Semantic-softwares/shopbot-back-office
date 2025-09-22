import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, switchMap, tap, of } from 'rxjs';

import { RoomsService } from '../../../../../shared/services/rooms.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { environment } from '../../../../../../environments/environment';
import { 
  Room, 
  RoomType, 
  CreateRoomRequest, 
  UpdateRoomRequest, 
  RoomStatus, 
  HousekeepingStatus,
  RoomFeatures,
  COMMON_AMENITIES,
  AccessibilityFeatures,
  ViewType,
  VIEW_TYPE_OPTIONS,
  BED_CONFIGURATIONS,
  Amenity
} from '../../../../../shared/models/room.model';

@Component({
  selector: 'app-room-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './room-form.component.html'
})
export class RoomFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private roomsService = inject(RoomsService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private http = inject(HttpClient);

  // State signals
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  uploading = signal<boolean>(false);
  roomTypes = signal<RoomType[]>([]);
  currentRoom = signal<Room | null>(null);
  
  // Photo upload properties
  selectedFiles: Array<{ file: File; name: string; preview: string }> = [];
  existingPhotos = signal<string[]>([]);
  
  // Computed properties
  isEditMode = computed(() => !!this.currentRoom());
  pageTitle = computed(() => this.isEditMode() ? 'Edit Room' : 'Create New Room');
  submitButtonText = computed(() => this.saving() ? 'Saving...' : (this.isEditMode() ? 'Update Room' : 'Create Room'));

  // Form
  roomForm!: FormGroup;

  // Options
  roomStatusOptions: { value: RoomStatus; label: string; color: string }[] = [
    { value: 'available', label: 'Available', color: 'green' },
    { value: 'occupied', label: 'Occupied', color: 'purple' },
    { value: 'maintenance', label: 'Maintenance', color: 'orange' },
    { value: 'cleaning', label: 'Cleaning', color: 'cyan' },
    { value: 'out_of_order', label: 'Out of Order', color: 'red' }
  ];

  housekeepingStatusOptions: { value: HousekeepingStatus; label: string; color: string }[] = [
    { value: 'clean', label: 'Clean', color: 'green' },
    { value: 'dirty', label: 'Dirty', color: 'orange' },
    { value: 'inspected', label: 'Inspected', color: 'cyan' },
    { value: 'out_of_order', label: 'Out of Order', color: 'red' }
  ];

  viewTypeOptions = VIEW_TYPE_OPTIONS;
  bedConfigurationOptions = BED_CONFIGURATIONS;
  amenitiesOptions = COMMON_AMENITIES;
  
  floorOptions = Array.from({ length: 20 }, (_, i) => ({ value: i + 1, label: `Floor ${i + 1}` }));
  
  sizeOptions = [
    { value: 'small', label: 'Small (< 200 sq ft)' },
    { value: 'medium', label: 'Medium (200-400 sq ft)' },
    { value: 'large', label: 'Large (400-600 sq ft)' },
    { value: 'extra-large', label: 'Extra Large (> 600 sq ft)' }
  ];

  // Helper method to convert size string to numeric value
  private convertSizeToNumber(sizeString: string): number {
    const sizeMap: Record<string, number> = {
      'small': 150,      // Representative value for small rooms
      'medium': 300,     // Representative value for medium rooms  
      'large': 500,      // Representative value for large rooms
      'extra-large': 700 // Representative value for extra-large rooms
    };
    return sizeMap[sizeString] || 300; // Default to medium size
  }

  // Helper method to convert numeric size to string for form display
  private convertSizeToString(sizeNumber: number): string {
    if (sizeNumber < 200) return 'small';
    if (sizeNumber < 400) return 'medium';
    if (sizeNumber < 600) return 'large';
    return 'extra-large';
  }

  qualityRatingOptions = [
    { value: 1, label: '1 Star' },
    { value: 2, label: '2 Stars' },
    { value: 3, label: '3 Stars' },
    { value: 4, label: '4 Stars' },
    { value: 5, label: '5 Stars' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadRoomTypes();
    this.checkForEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.roomForm = this.fb.group({
      roomNumber: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9\-_]+$/)]],
      name: [''],
      description: [''],
      roomType: ['', Validators.required],
      floor: [null],
      size: ['medium'],
      bedConfiguration: [''],
      capacity: [2, [Validators.min(1), Validators.max(20)]],
      maxOccupancy: [2, [Validators.min(1), Validators.max(20)]],
      priceOverride: [null, [Validators.min(0)]],
      viewType: ['interior'],
      qualityRating: [3, [Validators.min(1), Validators.max(5)]],
      status: ['available', Validators.required],
      housekeepingStatus: ['clean', Validators.required],
      notes: [''],
      maintenanceNotes: [''],
      amenities: [[]],
      features: this.fb.group({
        hasBalcony: [false],
        hasKitchen: [false],
        hasBathtub: [false],
        hasAirConditioning: [false],
        hasWifi: [false],
        hasTV: [false],
        oceanView: [false],
        cityView: [false]
      }),
      accessibilityFeatures: this.fb.group({
        wheelchairAccessible: [false],
        hearingAccessible: [false],
        visuallyAccessible: [false],
        rollInShower: [false],
        grabBars: [false]
      })
    });
  }

  private loadRoomTypes(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) {
      this.showError('No store selected');
      return;
    }

    this.loading.set(true);
    this.roomsService.getRoomTypes(storeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roomTypes) => {
          this.roomTypes.set(roomTypes.filter(rt => rt.active));
          this.loading.set(false);
        },
        error: (error) => {
          this.showError('Failed to load room types');
          this.loading.set(false);
        }
      });
  }

  private checkForEditMode(): void {
    const roomId = this.route.snapshot.paramMap.get('id');
    if (roomId) {
      this.loading.set(true);
      this.roomsService.getRoom(roomId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (room) => {
            this.currentRoom.set(room);
            this.populateForm(room);
            this.loading.set(false);
          },
          error: (error) => {
            this.showError('Failed to load room details');
            this.router.navigate(['../'], { relativeTo: this.route });
          }
        });
    }
  }

  private populateForm(room: Room): void {
    const roomTypeId = typeof room.roomType === 'string' ? room.roomType : room.roomType._id;
    
    this.roomForm.patchValue({
      roomNumber: room.roomNumber,
      name: room.name || '',
      description: room.description || '',
      roomType: roomTypeId,
      floor: room.floor || null,
      size: room.size ? this.convertSizeToString(room.size) : 'medium',
      bedConfiguration: room.bedConfiguration || '',
      capacity: room.capacity || 2,
      maxOccupancy: room.maxOccupancy || room.capacity || 2,
      priceOverride: room.priceOverride || null,
      viewType: room.viewType || 'interior',
      qualityRating: room.qualityRating || 3,
      status: room.status,
      housekeepingStatus: room.housekeepingStatus,
      notes: room.notes || '',
      maintenanceNotes: room.maintenanceNotes || '',
      amenities: room.amenities || [],
      features: {
        hasBalcony: room.features.hasBalcony || false,
        hasKitchen: room.features.hasKitchen || false,
        hasBathtub: room.features.hasBathtub || false,
        hasAirConditioning: room.features.hasAirConditioning || false,
        hasWifi: room.features.hasWifi || false,
        hasTV: room.features.hasTV || false,
        oceanView: room.features.oceanView || false,
        cityView: room.features.cityView || false
      },
      accessibilityFeatures: {
        wheelchairAccessible: room.accessibilityFeatures?.wheelchairAccessible || false,
        hearingAccessible: room.accessibilityFeatures?.hearingAccessible || false,
        visuallyAccessible: room.accessibilityFeatures?.visuallyAccessible || false,
        rollInShower: room.accessibilityFeatures?.rollInShower || false,
        grabBars: room.accessibilityFeatures?.grabBars || false
      }
    });

    // Handle existing photos
    this.existingPhotos.set(room.photos || []);
  }

  // Photo upload methods
  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processSelectedFiles(Array.from(input.files));
    }
  }

  private processSelectedFiles(files: File[]): void {
    this.selectedFiles = [];
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.selectedFiles.push({
            file: file,
            name: file.name,
            preview: e.target?.result as string
          });
        };
        reader.readAsDataURL(file);
      }
    });
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  uploadPhotos(): void {
    if (this.selectedFiles.length === 0) return;

    this.uploading.set(true);
    const formData = new FormData();
    
    this.selectedFiles.forEach(fileObj => {
      formData.append('files', fileObj.file);
    });

    // If in edit mode, upload to existing room
    if (this.isEditMode()) {
      const roomId = this.currentRoom()?._id;
      if (roomId) {
        this.http.post(`${environment.apiUrl}/rooms/upload/${roomId}`, formData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: any) => {
              this.showSuccess('Photos uploaded successfully');
              this.selectedFiles = [];
              // Update existing photos list
              const updatedPhotos = [...this.existingPhotos(), ...response.photos];
              this.existingPhotos.set(updatedPhotos);
              this.uploading.set(false);
            },
            error: (error) => {
              this.showError('Failed to upload photos: ' + (error.error?.message || error.message));
              this.uploading.set(false);
            }
          });
      }
    } else {
      // For new rooms, we'll handle photos after room creation
      this.showError('Please save the room first before uploading photos');
      this.uploading.set(false);
    }
  }

  private uploadPhotosForNewRoom(roomId: string): void {
    if (this.selectedFiles.length === 0) {
      this.router.navigate(['../'], { relativeTo: this.route });
      return;
    }

    const formData = new FormData();
    this.selectedFiles.forEach(fileObj => {
      formData.append('files', fileObj.file);
    });

    this.http.post(`${environment.apiUrl}/rooms/upload/${roomId}`, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.showSuccess('Room created and photos uploaded successfully');
          this.router.navigate(['../'], { relativeTo: this.route });
        },
        error: (error) => {
          this.showError('Room created but photo upload failed: ' + (error.error?.message || error.message));
          this.router.navigate(['../'], { relativeTo: this.route });
        }
      });
  }

  removeExistingPhoto(photoUrl: string): void {
    const roomId = this.currentRoom()?._id;
    if (!roomId) return;

    this.http.delete(`${environment.apiUrl}/rooms/${roomId}/photo`, {
      body: { photoUrl }
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        const updatedPhotos = this.existingPhotos().filter(url => url !== photoUrl);
        this.existingPhotos.set(updatedPhotos);
        this.showSuccess('Photo removed successfully');
      },
      error: (error) => {
        this.showError('Failed to remove photo: ' + (error.error?.message || error.message));
      }
    });
  }

  onSubmit(): void {
    if (this.roomForm.invalid) {
      this.markFormGroupTouched(this.roomForm);
      return;
    }

    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) {
      this.showError('No store selected');
      return;
    }

    this.saving.set(true);
    const formValue = this.roomForm.value;
    
    const roomData = {
      roomType: formValue.roomType,
      roomNumber: formValue.roomNumber,
      name: formValue.name,
      description: formValue.description,
      floor: formValue.floor,
      size: this.convertSizeToNumber(formValue.size),
      bedConfiguration: formValue.bedConfiguration,
      capacity: formValue.capacity,
      maxOccupancy: formValue.maxOccupancy,
      priceOverride: formValue.priceOverride,
      viewType: formValue.viewType,
      qualityRating: formValue.qualityRating,
      status: formValue.status,
      housekeepingStatus: formValue.housekeepingStatus,
      notes: formValue.notes,
      maintenanceNotes: formValue.maintenanceNotes,
      amenities: formValue.amenities,
      features: formValue.features,
      accessibilityFeatures: formValue.accessibilityFeatures
    };

    const request$ = this.isEditMode() 
      ? this.roomsService.updateRoom(this.currentRoom()!._id!, roomData as UpdateRoomRequest)
      : this.roomsService.createRoom(storeId, roomData as CreateRoomRequest);

    request$.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const message = this.isEditMode() ? 'Room updated successfully' : 'Room created successfully';
          this.showSuccess(message);
          
          // If creating a new room and there are selected files, upload them
          if (!this.isEditMode() && this.selectedFiles.length > 0) {
            const roomId = result._id || result.id;
            if (roomId) {
              this.uploadPhotosForNewRoom(roomId);
            } else {
              this.router.navigate(['../'], { relativeTo: this.route });
            }
          } else {
            this.router.navigate(['../'], { relativeTo: this.route });
          }
        },
        error: (error) => {
          const message = this.isEditMode() ? 'Failed to update room' : 'Failed to create room';
          this.showError(message + ': ' + (error.error?.message || error.message));
          this.saving.set(false);
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.roomForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.roomForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['pattern']) return `${fieldName} format is invalid`;
      if (field.errors['min']) return `${fieldName} must be greater than ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} must be less than ${field.errors['max'].max}`;
    }
    return '';
  }

  getRoomTypeName(roomTypeId: string): string {
    const roomType = this.roomTypes().find(rt => rt._id === roomTypeId || rt.id === roomTypeId);
    return roomType?.name || 'Unknown';
  }

  // Amenities management
  toggleAmenity(amenity: string): void {
    const currentAmenities = this.roomForm.get('amenities')?.value || [];
    const index = currentAmenities.indexOf(amenity);
    
    let updatedAmenities;
    if (index > -1) {
      updatedAmenities = currentAmenities.filter((a: string) => a !== amenity);
    } else {
      updatedAmenities = [...currentAmenities, amenity];
    }
    
    this.roomForm.patchValue({ amenities: updatedAmenities });
  }

  isAmenitySelected(amenity: string): boolean {
    const amenities = this.roomForm.get('amenities')?.value || [];
    return amenities.includes(amenity);
  }

  removeAmenity(amenity: string): void {
    const currentAmenities = this.roomForm.get('amenities')?.value || [];
    const updatedAmenities = currentAmenities.filter((a: string) => a !== amenity);
    this.roomForm.patchValue({ amenities: updatedAmenities });
  }

  getSelectedAmenities(): string[] {
    return this.roomForm.get('amenities')?.value || [];
  }
}