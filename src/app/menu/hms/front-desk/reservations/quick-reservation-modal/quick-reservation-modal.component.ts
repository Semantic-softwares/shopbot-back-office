import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { RoomsService } from '../../../../../shared/services/rooms.service';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { of } from 'rxjs';

interface AvailableRoom {
  id?: string;
  _id?: string;
  name: string;
  roomType: { name: string };
  roomNumber?: string;
  pricePerNight?: number;
  priceOverride?: number;
  maxCapacity?: number;
  amenities?: string[];
}

export interface QuickReservationData {
  bookingType: 'single' | 'group';
  checkInDate: Date;
  checkOutDate: Date;
  roomTypeFilter: string;
  selectedRoom: string;
  adults: number;
  children: number;
}

// Dialog input data interface for pre-filling from calendar drag selection
export interface QuickReservationDialogData {
  checkInDate: Date;
  checkOutDate: Date;
  preselectedRoomId?: string;
  preselectedRoomName?: string;
  preselectedRoomTypeId?: string;
  preselectedRoomTypeName?: string;
}

@Component({
  selector: 'app-quick-reservation-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CurrencyPipe,
  ],
  templateUrl: './quick-reservation-modal.component.html',
  styleUrls: ['./quick-reservation-modal.component.scss']
})
export class QuickReservationModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<QuickReservationModalComponent>);
  private roomsService = inject(RoomsService);
  private router = inject(Router);
  public storeStore = inject(StoreStore);
  
  // Optional dialog data for pre-filling from calendar drag selection
  public dialogData = inject<QuickReservationDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  public roomTypeField = new FormControl('');

  // Min date signal - today or later
  public minDate = signal(new Date());

  public quickReservationForm = this.fb.group({
    bookingType: ['single', Validators.required],
    dateRange: this.fb.group({
      start: [new Date(), [Validators.required, this.minDateValidator.bind(this)]],
      end: [this.getNextDay(new Date()), [Validators.required, this.minDateValidator.bind(this)]],
    }),
    selectedRoom: ['', Validators.required],
    adults: [1, [Validators.required, Validators.min(1)]],
    children: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    // Pre-fill form with dialog data if provided (from calendar drag selection)
    if (this.dialogData) {
      if (this.dialogData.checkInDate && this.dialogData.checkOutDate) {
        this.quickReservationForm.get('dateRange')?.patchValue({
          start: this.dialogData.checkInDate,
          end: this.dialogData.checkOutDate
        });
      }
      
      if (this.dialogData.preselectedRoomId) {
        // Set the room after the available rooms are loaded
        this.quickReservationForm.patchValue({ selectedRoom: this.dialogData.preselectedRoomId });
      }
      
      if (this.dialogData.preselectedRoomTypeName) {
        // Set the room type filter
        this.roomTypeField.patchValue(this.dialogData.preselectedRoomTypeName);
      }
    }
  }

  // Store preselected room ID to set after rooms are loaded
  private preselectedRoomId: string | null = null;

  // Signals for form values - similar to reservation form
  public checkIn = toSignal(
    this.quickReservationForm.get('dateRange.start')!.valueChanges,
    { initialValue: this.quickReservationForm.get('dateRange.start')!.value }
  );

  public checkOut = toSignal(
    this.quickReservationForm.get('dateRange.end')!.valueChanges,
    { initialValue: this.quickReservationForm.get('dateRange.end')!.value }
  );

  public selectedRoomId = toSignal(
    this.quickReservationForm.get('selectedRoom')!.valueChanges,
    { initialValue: this.quickReservationForm.get('selectedRoom')!.value }
  );

  public bookingType = toSignal(
    this.quickReservationForm.get('bookingType')!.valueChanges,
    { initialValue: this.quickReservationForm.get('bookingType')!.value }
  );

  public adultsValue = toSignal(
    this.quickReservationForm.get('adults')!.valueChanges,
    { initialValue: this.quickReservationForm.get('adults')!.value }
  );

  public childrenValue = toSignal(
    this.quickReservationForm.get('children')!.valueChanges,
    { initialValue: this.quickReservationForm.get('children')!.value }
  );

  // Calculate number of nights
  public numberOfNights = computed(() => {
    const checkIn = this.checkIn();
    const checkOut = this.checkOut();
    if (!checkIn || !checkOut) return 0;
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  });

  // rxResource for loading available rooms - similar to reservation form
  public availableRoomsResource = rxResource({
    params: () => ({ 
      checkIn: this.checkIn(), 
      checkOut: this.checkOut(),
      storeId: this.storeStore.selectedStore()?._id 
    }),
    stream: ({ params }) => this.getAvailableRooms({
      checkIn: params.checkIn!,
      checkOut: params.checkOut!,
      storeId: params.storeId!,
    }),
  });

  // Room type filtering
  private roomTypeValue = toSignal(this.roomTypeField.valueChanges, { 
    initialValue: this.roomTypeField.value 
  });

  public uniqueRoomTypes = computed(() => {
    const rooms = this.availableRoomsResource.value() || [];
    const types = new Set(rooms.map(room => room.roomType.name));
    return Array.from(types).sort();
  });

  public filteredRooms = computed(() => {
    const rooms = this.availableRoomsResource.value() || [];
    const selectedType = this.roomTypeValue();
    
    // Auto-select preselected room when rooms are loaded
    if (this.preselectedRoomId && rooms.length > 0) {
      const preselectedRoom = rooms.find(r => (r._id || r.id) === this.preselectedRoomId);
      if (preselectedRoom) {
        // Set the room in the form
        this.quickReservationForm.get('selectedRoom')?.setValue(this.preselectedRoomId);
        // Clear the preselected ID so we don't keep setting it
        this.preselectedRoomId = null;
      }
    }
    
    if (!selectedType) return rooms;
    return rooms.filter(room => room.roomType.name === selectedType);
  });

  // Get max capacity from selected room(s)
  public maxCapacity = computed(() => {
    const selectedRoomId = this.selectedRoomId();
    const rooms = this.availableRoomsResource.value() || [];
    const bookingType = this.bookingType();

    if (!selectedRoomId) return { adults: 0, children: 0 };

    const roomIds = Array.isArray(selectedRoomId) ? selectedRoomId : [selectedRoomId];
    let maxAdults = 0;
    let maxChildren = 0;

    roomIds.forEach(id => {
      const room = rooms.find(r => (r._id || r.id) === id);
      if (room?.roomType?.capacity) {
        maxAdults += room.roomType.capacity.adults || 0;
        maxChildren += room.roomType.capacity.children || 0;
      }
    });

    return { adults: maxAdults, children: maxChildren };
  });

  // Validator for occupancy
  private occupancyValidator = (): any => {
    const adults = this.adultsValue() || 0;
    const children = this.childrenValue() || 0;
    const maxCap = this.maxCapacity();

    if (adults > maxCap.adults) {
      this.quickReservationForm.get('adults')?.setErrors({ exceedsCapacity: true });
      return { exceedsCapacity: true };
    }

    if (children > maxCap.children) {
      this.quickReservationForm.get('children')?.setErrors({ exceedsCapacity: true });
      return { exceedsCapacity: true };
    }

    if (adults + children > (maxCap.adults + maxCap.children)) {
      this.quickReservationForm.setErrors({ totalOccupancyExceeded: true });
      return { totalOccupancyExceeded: true };
    }

    // Clear errors if validation passes
    if (this.quickReservationForm.hasError('totalOccupancyExceeded')) {
      this.quickReservationForm.setErrors(null);
    }

    return null;
  };

  // Effect to run occupancy validation when inputs change
  private occupancyCheck = computed(() => {
    // Trigger validation whenever adults, children, or max capacity changes
    this.adultsValue();
    this.childrenValue();
    this.maxCapacity();
    return this.occupancyValidator();
  });

  // Calculate total amount based on selected room(s) and number of nights
  public totalAmount = computed(() => {
    const selectedRoomId = this.selectedRoomId();
    const rooms = this.availableRoomsResource.value() || [];
    const nights = this.numberOfNights();

    if (!selectedRoomId || nights === 0) return 0;

    // Handle both single and multiple selections (array vs string)
    const roomIds = Array.isArray(selectedRoomId) ? selectedRoomId : [selectedRoomId];
    
    let totalPrice = 0;
    roomIds.forEach(id => {
      const room = rooms.find(r => (r._id || r.id) === id);
      if (room) {
        const price = room.priceOverride || room.pricePerNight || 0;
        totalPrice += price;
      }
    });

    return totalPrice * nights;
  });


  private getAvailableRooms(params: { checkIn: Date; checkOut: Date; storeId: string }) {
    const checkInDate = new Date(params.checkIn).toISOString().split('T')[0];
    const checkOutDate = new Date(params.checkOut).toISOString().split('T')[0];
    
    if (!checkInDate || !checkOutDate || !params.storeId) {
      return of<AvailableRoom[]>([]);
    }

    return this.roomsService.getAvailableRooms({
      storeId: params.storeId,
      checkInDate,
      checkOutDate,
    });
  }

  private minDateValidator(control: any) {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { minDateInvalid: true };
    }
    return null;
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public onProceed(): void {
    if (this.quickReservationForm.invalid || this.occupancyCheck()) {
      return;
    }

    const formValue = this.quickReservationForm.value;
    const dateRange = formValue.dateRange;
    
    const data: QuickReservationData = {
      bookingType: formValue.bookingType as 'single' | 'group',
      checkInDate: dateRange?.start as Date,
      checkOutDate: dateRange?.end as Date,
      roomTypeFilter: this.roomTypeField.value || '',
      selectedRoom: this.selectedRoomId() || '',
      adults: formValue.adults || 1,
      children: formValue.children || 0,
    };

    // Close dialog and navigate to reservation form with query params
    this.dialogRef.close(data);
  }

  private getNextDay(date: Date): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
  }
}
