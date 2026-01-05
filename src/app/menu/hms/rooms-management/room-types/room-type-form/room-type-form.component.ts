import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { 
  RoomType, 
  CreateRoomTypeRequest, 
  UpdateRoomTypeRequest, 
  RoomFeatures,
  COMMON_AMENITIES,
  BED_CONFIGURATIONS,
  Amenity
} from '../../../../../shared/models/room.model';

@Component({
  selector: 'app-room-type-form',
  standalone: true,
  imports: [
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
    MatProgressSpinnerModule,
    PageHeaderComponent
  ],
  templateUrl: './room-type-form.component.html'
})
export class RoomTypeFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private roomsService = inject(RoomsService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // Signals
  roomTypeForm = signal<FormGroup>(this.createForm());
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  roomTypeId = signal<string | null>(null);
  currentRoomType = signal<RoomType | null>(null);
  error = signal<string | null>(null);

  // Computed values
  formTitle = computed(() => this.isEditMode() ? 'Edit Room Type' : 'Create Room Type');
  submitButtonText = computed(() => this.saving() ? 'Saving...' : (this.isEditMode() ? 'Update Room Type' : 'Create Room Type'));

  // Constants
  readonly commonAmenities = COMMON_AMENITIES;
  readonly bedConfigurations = BED_CONFIGURATIONS;

  ngOnInit() {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      tap(params => {
        const id = params['id'];
        if (id && id !== 'create') {
          this.roomTypeId.set(id);
          this.isEditMode.set(true);
          this.loadRoomType(id);
        } else {
          this.isEditMode.set(false);
          this.roomTypeId.set(null);
        }
      })
    ).subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      basePrice: [0, [Validators.required, Validators.min(0.01)]],
      capacity: this.fb.group({
        adults: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
        children: [0, [Validators.min(0), Validators.max(10)]],
        infants: [0, [Validators.min(0), Validators.max(5)]]
      }),
      maxOccupancy: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
      size: [0, [Validators.min(0)]],
      bedConfiguration: [''],
      features: this.fb.group({
        hasPrivateBathroom: [true],
        hasAirConditioning: [false],
        hasWifi: [true],
        hasTv: [false],
        hasRefrigerator: [false],
        hasBalcony: [false],
        hasKitchenette: [false],
        hasWorkDesk: [false],
        hasSafe: [false],
        hasHairdryer: [false],
        hasIroning: [false],
        hasSeatingArea: [false]
      }),
      amenities: this.fb.array([]),
      customAmenities: this.fb.array([]),
      active: [true],
      sortOrder: [0, [Validators.min(0)]]
    });
  }

  get amenitiesFormArray(): FormArray {
    return this.roomTypeForm().get('amenities') as FormArray;
  }

  get customAmenitiesFormArray(): FormArray {
    return this.roomTypeForm().get('customAmenities') as FormArray;
  }

  private loadRoomType(id: string) {
    this.loading.set(true);
    this.error.set(null);

    this.roomsService.getRoomType(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (roomType) => {
        this.currentRoomType.set(roomType);
        this.populateForm(roomType);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading room type:', error);
        this.error.set('Failed to load room type');
        this.loading.set(false);
        this.snackBar.open('Failed to load room type', 'Close', { duration: 3000 });
      }
    });
  }

  private populateForm(roomType: RoomType) {
    const form = this.roomTypeForm();
    
    form.patchValue({
      name: roomType.name,
      description: roomType.description || '',
      basePrice: roomType.basePrice,
      capacity: roomType.capacity,
      maxOccupancy: roomType.maxOccupancy,
      size: roomType.size || 0,
      bedConfiguration: roomType.bedConfiguration || '',
      features: roomType.features,
      active: roomType.active,
      sortOrder: roomType.sortOrder || 0
    });

    // Populate amenities
    this.populateAmenities(roomType.amenities || []);
  }

  private populateAmenities(amenities: string[]) {
    const amenitiesArray = this.amenitiesFormArray;
    const customAmenitiesArray = this.customAmenitiesFormArray;
    
    // Clear existing
    amenitiesArray.clear();
    customAmenitiesArray.clear();

    amenities.forEach(amenity => {
      const isCommonAmenity = this.commonAmenities.includes(amenity as any);
      if (isCommonAmenity) {
        amenitiesArray.push(this.fb.control(amenity));
      } else {
        customAmenitiesArray.push(this.fb.control(amenity));
      }
    });
  }

  onAmenityChange(amenityId: string, checked: boolean) {
    const amenitiesArray = this.amenitiesFormArray;
    
    if (checked) {
      amenitiesArray.push(this.fb.control(amenityId));
    } else {
      const index = amenitiesArray.controls.findIndex(control => control.value === amenityId);
      if (index !== -1) {
        amenitiesArray.removeAt(index);
      }
    }
  }

  isAmenitySelected(amenityId: string): boolean {
    return this.amenitiesFormArray.controls.some(control => control.value === amenityId);
  }

  addCustomAmenity(amenityName: string) {
    if (amenityName.trim()) {
      this.customAmenitiesFormArray.push(this.fb.control(amenityName.trim()));
    }
  }

  removeCustomAmenity(index: number) {
    this.customAmenitiesFormArray.removeAt(index);
  }

  onSubmit() {
    const form = this.roomTypeForm();
    
    if (form.valid) {
      this.saving.set(true);
      this.error.set(null);

      const formValue = form.value;
      
      // Combine regular amenities and custom amenities
      const allAmenities = [
        ...(formValue.amenities || []),
        ...(formValue.customAmenities || [])
      ];

      const roomTypeData = {
        name: formValue.name,
        description: formValue.description,
        basePrice: formValue.basePrice,
        capacity: formValue.capacity,
        maxOccupancy: formValue.maxOccupancy,
        size: formValue.size,
        bedConfiguration: formValue.bedConfiguration,
        features: formValue.features,
        amenities: allAmenities,
        active: formValue.active,
        sortOrder: formValue.sortOrder
      };

      const request$ = this.isEditMode() 
        ? this.roomsService.updateRoomType(this.roomTypeId()!, roomTypeData as UpdateRoomTypeRequest)
        : this.roomsService.createRoomType(this.storeStore.selectedStore()!._id, roomTypeData as CreateRoomTypeRequest);

      request$.pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (roomType) => {
          this.saving.set(false);
          const action = this.isEditMode() ? 'updated' : 'created';
          this.snackBar.open(`Room type ${action} successfully`, 'Close', { duration: 3000 });
          this.router.navigate(['/menu/hms/rooms-management/room-types/room-types']);
        },
        error: (error) => {
          console.error('Error saving room type:', error);
          this.saving.set(false);
          const action = this.isEditMode() ? 'update' : 'create';
          this.error.set(`Failed to ${action} room type`);
          this.snackBar.open(`Failed to ${action} room type`, 'Close', { duration: 3000 });
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(form.controls).forEach(key => {
        const control = form.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      
      this.snackBar.open('Please correct the errors in the form', 'Close', { duration: 3000 });
    }
  }

  onCancel() {
    this.router.navigate(['/menu/hms/rooms-management/room-types/room-types']);
  }

  // Helper methods for validation
  hasError(controlName: string, errorType: string): boolean {
    const control = this.roomTypeForm().get(controlName);
    return !!(control && control.hasError(errorType) && control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.roomTypeForm().get(controlName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;
    if (errors['required']) return `${this.getFieldLabel(controlName)} is required`;
    if (errors['minlength']) return `${this.getFieldLabel(controlName)} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${this.getFieldLabel(controlName)} must not exceed ${errors['maxlength'].requiredLength} characters`;
    if (errors['min']) return `${this.getFieldLabel(controlName)} must be at least ${errors['min'].min}`;
    if (errors['max']) return `${this.getFieldLabel(controlName)} must not exceed ${errors['max'].max}`;
    
    return 'Invalid value';
  }

  private getFieldLabel(controlName: string): string {
    const labels: Record<string, string> = {
      name: 'Room type name',
      description: 'Description',
      basePrice: 'Base price',
      maxOccupancy: 'Maximum occupancy',
      size: 'Room size',
      sortOrder: 'Sort order'
    };
    return labels[controlName] || controlName;
  }

  // Computed helper for total capacity
  totalCapacity = computed(() => {
    const form = this.roomTypeForm();
    const capacity = form.get('capacity')?.value;
    if (capacity) {
      return (capacity.adults || 0) + (capacity.children || 0) + (capacity.infants || 0);
    }
    return 0;
  });

  // Update max occupancy when capacity changes
  onCapacityChange() {
    const form = this.roomTypeForm();
    const total = this.totalCapacity();
    const maxOccupancyControl = form.get('maxOccupancy');
    
    if (maxOccupancyControl && maxOccupancyControl.value < total) {
      maxOccupancyControl.setValue(total);
    }
  }
}