import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of, startWith } from 'rxjs';

import { ReservationService } from '../../../../../shared/services/reservation.service';
import { RoomsService } from '../../../../../shared/services/rooms.service';
import { GuestService } from '../../../../../shared/services/guest.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import { 
  CreateReservationDto, 
  UpdateReservationDto,
  Reservation, 
  PaymentMethod,
  ReservationStatus,
  AdditionalGuest,
  BookingSource,
  Guest
} from '../../../../../shared/models/reservation.model';
import { AvailableRoom } from '../../../../../shared/models/room.model';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatStepperModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatAutocompleteModule,
  ],
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.scss']
})
export class ReservationFormComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private reservationService = inject(ReservationService);
  private roomsService = inject(RoomsService);
  private guestService = inject(GuestService);
  private authService = inject(AuthService);
  private storeStore = inject(StoreStore);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Component state
  reservationForm!: FormGroup;
  reservationDetailsGroup!: FormGroup;
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  isEditing = signal<boolean>(false);
  editingReservation = signal<Reservation | null>(null);
  availableRooms = signal<AvailableRoom[]>([]);
  roomSearchLoading = signal<boolean>(false);
  
  // Form calculations
  totalAmount = signal<number>(0);
  numberOfNights = signal<number>(0);
  taxAmount = signal<number>(0);
  discountAmount = signal<number>(0);
  
  // Room capacity constraints
  maxAdultsAllowed = signal<number>(0);
  maxChildrenAllowed = signal<number>(0);
  selectedRoomDetails = signal<AvailableRoom[]>([]);

  // Guest search functionality
  guestSearchResults = signal<Guest[]>([]);
  selectedGuest = signal<Guest | null>(null);
  guestSearchLoading = signal<boolean>(false);
  guestSearchControl = new FormControl('');
  filteredGuests = signal<Guest[]>([]);

  // Dropdown options
  roomTypes: string[] = ['standard', 'deluxe', 'suite', 'presidential'];
  paymentMethods: PaymentMethod[] = ['cash', 'card', 'bank_transfer', 'mobile_money', 'online'];
  
  public currentUser = toSignal(this.authService.currentUser, {
    initialValue: null,
  });
  
  // Guest type options
  guestTypes = [
    { value: 'individual', label: 'Individual' },
    { value: 'business', label: 'Business' },
    { value: 'group', label: 'Group' }
  ];

  constructor() {
    this.initializeForm();
  }

  ngOnInit() {
    this.setupFormSubscriptions();
    this.checkIfEditing();
    this.setupGuestAutocomplete();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.reservationForm = this.fb.group({
      // Guest Information
      guestDetails: this.fb.group({
        primaryGuest: this.fb.group({
          firstName: ['', [Validators.required, Validators.minLength(2)]],
          lastName: ['', [Validators.required, Validators.minLength(2)]],
          email: ['', [Validators.required, Validators.email]],
          phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-()]+$/)]],
        }),
        additionalGuests: this.fb.array([]),
        totalAdults: [1, [Validators.required, Validators.min(1)]],
        totalChildren: [0, [Validators.min(0)]],
      }),

      // Reservation Details
      checkInDate: [null, Validators.required],
      checkOutDate: [null, Validators.required],
      expectedCheckInTime: ['15:00'],
      expectedCheckOutTime: ['11:00'],
      rooms: this.fb.array([]), // Start with empty array
      specialRequests: [''],
      internalNotes: [''],

      // Payment Information
      paymentInfo: this.fb.group({
        method: ['card', Validators.required],
        status: ['pending']
      }),

      // Pricing
      pricing: this.fb.group({
        subtotal: [0, [Validators.required, Validators.min(0)]],
        taxes: [0, [Validators.min(0)]],
        fees: this.fb.group({
          serviceFee: [0],
          cleaningFee: [0],
          resortFee: [0],
          other: [0]
        }),
        discounts: this.fb.group({
          amount: [0],
          reason: [''],
          code: ['']
        }),
        total: [{ value: 0, disabled: true }],
        paid: [0],
        balance: [{ value: 0, disabled: true }]
      }),
      store: this.storeStore.selectedStore() ?._id || '',
      createdBy: this.currentUser()?._id || '',
      // Metadata
      bookingSource: ['walk_in'],
      status: ['pending']
    });

    // Step control groups for stepper validation
    this.reservationDetailsGroup = this.fb.group({
      checkInDate: this.reservationForm.get('checkInDate'),
      checkOutDate: this.reservationForm.get('checkOutDate'),
      roomsSelected: [false, Validators.requiredTrue] // Custom validator for room selection
    });
  }

  private createRoomForm(): FormGroup {
    return this.fb.group({
      roomId: ['', Validators.required]
    });
  }

  private setupFormSubscriptions() {
    // Watch for date changes to calculate nights and search rooms
    const dateControls = [
      this.reservationForm.get('checkInDate'),
      this.reservationForm.get('checkOutDate')
    ];

    dateControls.forEach(control => {
      control?.valueChanges
        .pipe(
          takeUntil(this.destroy$),
          debounceTime(300),
          distinctUntilChanged()
        )
        .subscribe(() => {
          this.calculateNights();
          this.searchAvailableRooms();
        });
    });

    // Watch for pricing changes
    const pricingControls = [
      'pricing.subtotal',
      'pricing.taxes', 
      'pricing.fees.serviceFee',
      'pricing.fees.cleaningFee',
      'pricing.discounts.amount'
    ];

    pricingControls.forEach(controlPath => {
      this.reservationForm.get(controlPath)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((value) => {
          // 🔍 DEBUG: Log when discount amount changes
          if (controlPath === 'pricing.discounts.amount') {
            console.log('💰 DISCOUNT INPUT CHANGED:', {
              path: controlPath,
              newValue: value,
              typeOf: typeof value,
              rawFormValue: this.reservationForm.get('pricing.discounts.amount')?.value
            });
          }
          this.calculateTotal();
        });
    });

    // 🔍 ADDITIONAL DEBUG: Watch the entire discount object for any changes
    this.reservationForm.get('pricing.discounts')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((discountObj) => {
        console.log('🎯 ENTIRE DISCOUNT OBJECT CHANGED:', {
          discountObject: discountObj,
          amount: discountObj?.amount,
          amountType: typeof discountObj?.amount
        });
      });

    // Watch for room selection changes to update capacity and pricing
    this.rooms.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateRoomCapacityLimits();
        this.calculatePricingFromRooms();
      });
  }

  private checkIfEditing() {
    const reservationId = this.route.snapshot.paramMap.get('id');
    if (reservationId) {
      this.isEditing.set(true);
      this.loadReservationForEditing(reservationId);
    }
  }

  private loadReservationForEditing(id: string) {
    this.loading.set(true);
    this.reservationService.getReservationById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservation) => {
          this.editingReservation.set(reservation);
          this.populateFormWithReservation(reservation!);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set('Failed to load reservation for editing');
          this.loading.set(false);
          console.error('Error loading reservation:', error);
        }
      });
  }

  private populateFormWithReservation(reservation: Reservation) {
    console.log('Populating form with reservation:', reservation);
    
    // Populate guest information
    this.reservationForm.patchValue({
      guestDetails: {
        primaryGuest: reservation.guestDetails.primaryGuest,
        totalAdults: reservation.guestDetails.totalAdults,
        totalChildren: reservation.guestDetails.totalChildren
      },
      checkInDate: new Date(reservation.checkInDate),
      checkOutDate: new Date(reservation.checkOutDate),
      expectedCheckInTime: reservation.expectedCheckInTime || '15:00',
      expectedCheckOutTime: reservation.expectedCheckOutTime || '11:00',
      specialRequests: reservation.specialRequests || '',
      internalNotes: reservation.internalNotes || '',
      paymentInfo: {
        method: reservation.paymentInfo?.method || 'card',
        status: reservation.paymentInfo?.status || 'pending'
      },
      pricing: {
        subtotal: reservation.pricing?.subtotal || 0,
        taxes: reservation.pricing?.taxes || 0,
        fees: {
          serviceFee: reservation.pricing?.fees?.serviceFee || 0,
          cleaningFee: reservation.pricing?.fees?.cleaningFee || 0,
          resortFee: reservation.pricing?.fees?.resortFee || 0,
          other: reservation.pricing?.fees?.other || 0
        },
        discounts: {
          amount: reservation.pricing?.discounts?.amount || 0,
          reason: reservation.pricing?.discounts?.reason || '',
          code: reservation.pricing?.discounts?.code || ''
        },
        total: reservation.pricing?.total || 0,
        paid: reservation.pricing?.paid || 0,
        balance: reservation.pricing?.balance || 0
      },
      bookingSource: reservation.bookingSource || 'walk_in',
      status: reservation.status
    });

    // First populate additional guests BEFORE loading rooms
    console.log('Populating additional guests IMMEDIATELY:', reservation.guestDetails.additionalGuests);
    this.populateAdditionalGuests(reservation.guestDetails.additionalGuests || []);
    
    // Load available rooms for edit mode to enable proper pricing calculations
    this.searchAvailableRooms();

    // Use a longer timeout to ensure room search completes and then populate rooms
    setTimeout(() => {
      console.log('Available rooms after search:', this.availableRooms().length);
      
      // Populate rooms after available rooms are loaded
      this.populateRooms(reservation.rooms);
      
      // Force update calculations
      this.calculateNights();
      this.calculateTotal();
      this.updateRoomCapacityLimits();
      this.updateStepValidation();
      
      // Update signals for the UI
      this.totalAmount.set(reservation.pricing?.total || 0);
      this.taxAmount.set(reservation.pricing?.taxes || 0);
      this.discountAmount.set(reservation.pricing?.discounts?.amount || 0);
      
      // CRITICAL: Force multiple change detection cycles to ensure UI updates
      this.cdr.detectChanges();
      
      setTimeout(() => {
        console.log('Final form state check:');
        console.log('Additional guests count:', this.additionalGuests.length);
        console.log('Additional guests value:', this.additionalGuests.value);
        console.log('Selected rooms count:', this.rooms.length);
        console.log('Selected rooms value:', this.rooms.value);
        
        // Force UI refresh to ensure everything is displayed
        this.forceUIRefresh();
      }, 100);
      
    }, 1500); // Increased timeout to ensure room search completes
  }

  private populateRooms(rooms: any[]) {
    console.log('populateRooms called with:', rooms);
    const roomsArray = this.reservationForm.get('rooms') as FormArray;
    roomsArray.clear();

    rooms.forEach((roomData, index) => {
      const roomForm = this.createRoomForm();
      const roomId = typeof roomData.room === 'string' ? roomData.room : roomData.room._id;
      console.log(`Setting room ${index} ID to:`, roomId);
      
      roomForm.patchValue({
        roomId: roomId
      });
      roomsArray.push(roomForm);
    });
    
    console.log('Final rooms array length:', roomsArray.length);
    console.log('Rooms form values:', roomsArray.value);
    console.log('Available rooms for matching:', this.availableRooms().map(r => ({ id: r.id, _id: r._id, roomNumber: r.roomNumber })));
  }

  private populateAdditionalGuests(additionalGuests: AdditionalGuest[]) {
    console.log('=== POPULATING ADDITIONAL GUESTS ===');
    console.log('Input data:', additionalGuests);
    
    const additionalGuestsArray = this.reservationForm.get('guestDetails.additionalGuests') as FormArray;
    
    // Clear existing forms
    while (additionalGuestsArray.length !== 0) {
      additionalGuestsArray.removeAt(0);
    }
    console.log('Cleared existing forms, array length:', additionalGuestsArray.length);

    if (additionalGuests && additionalGuests.length > 0) {
      additionalGuests.forEach((guest, index) => {
        console.log(`Processing additional guest ${index}:`, guest);
        
        const guestForm = this.createAdditionalGuestForm();
        guestForm.patchValue({
          firstName: guest.firstName || '',
          lastName: guest.lastName || '',
          age: guest.age || null,
          relationship: guest.relationship || ''
        });
        
        console.log(`Guest form ${index} value after patch:`, guestForm.value);
        additionalGuestsArray.push(guestForm);
        console.log(`Added guest form ${index}, array length now:`, additionalGuestsArray.length);
      });
    }
    
    // Force form to recognize changes
    additionalGuestsArray.markAsDirty();
    additionalGuestsArray.updateValueAndValidity();
    
    console.log('=== FINAL ADDITIONAL GUESTS STATE ===');
    console.log('Array length:', additionalGuestsArray.length);
    console.log('Array value:', additionalGuestsArray.value);
    console.log('Array valid:', additionalGuestsArray.valid);
    console.log('======================================');
    
    // Force change detection immediately
    this.cdr.detectChanges();
  }

  private calculateNights() {
    const checkIn = this.reservationForm.get('checkInDate')?.value;
    const checkOut = this.reservationForm.get('checkOutDate')?.value;

    if (checkIn && checkOut) {
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      console.log('Calculated nights:', diffDays, 'from', checkIn, 'to', checkOut);
      this.numberOfNights.set(diffDays);
      
      // Recalculate pricing when dates change
      this.calculatePricingFromRooms();
      this.calculateTotal();
    } else {
      console.log('Cannot calculate nights - missing dates:', { checkIn, checkOut });
      this.numberOfNights.set(0);
    }
  }

  private calculateTotal() {
    const pricing = this.reservationForm.get('pricing')?.value;
    if (!pricing) {
      console.log('No pricing data available');
      return;
    }

    // 🔍 DETAILED DEBUG: Track discount value at every step
    const directDiscountControl = this.reservationForm.get('pricing.discounts.amount');
    const directValue = directDiscountControl?.value;
    const pricingDiscountValue = pricing.discounts?.amount;
    
    console.log('🔍 DISCOUNT VALUE INVESTIGATION:', {
      'Step 1 - Direct control value': directValue,
      'Step 2 - Pricing object discount': pricingDiscountValue,
      'Step 3 - Values match': directValue === pricingDiscountValue,
      'Step 4 - Control path exists': !!directDiscountControl,
      'Step 5 - Pricing object exists': !!pricing.discounts,
      'Step 6 - Full pricing.discounts': pricing.discounts
    });

    const subtotal = pricing.subtotal || 0;
    const taxes = pricing.taxes || 0;
    const serviceFee = pricing.fees?.serviceFee || 0;
    const cleaningFee = pricing.fees?.cleaningFee || 0;
    const resortFee = pricing.fees?.resortFee || 0;
    const otherFees = pricing.fees?.other || 0;
    
    // 🔧 FIX: Read discount directly from form control instead of pricing object
    const discounts = this.reservationForm.get('pricing.discounts.amount')?.value || 0;
    
    console.log('🔧 FIXED DISCOUNT READING:', {
      'OLD way (pricing.discounts?.amount)': pricing.discounts?.amount,
      'NEW way (direct form control)': discounts,
      'Fix applied': true
    });

    // 🔍 DEBUG: Log raw form values and discount details
    console.log('🧮 RAW PRICING VALUES:', {
      'Raw discount input': pricing.discounts?.amount,
      'Type of discount': typeof pricing.discounts?.amount,
      'Full discount object': pricing.discounts,
      'Full pricing object': pricing
    });

    const totalFees = serviceFee + cleaningFee + resortFee + otherFees;
    const total = subtotal + taxes + totalFees - discounts;
    const balance = total - (pricing.paid || 0);

    // ✅ ENHANCED DEBUGGING - This will help identify the pricing issue
    console.log('🔍 DETAILED PRICING CALCULATION:', {
      subtotal: `₦${subtotal.toLocaleString()}`,
      taxes: `₦${taxes.toLocaleString()}`,
      fees: {
        serviceFee: `₦${serviceFee.toLocaleString()}`,
        cleaningFee: `₦${cleaningFee.toLocaleString()}`,
        resortFee: `₦${resortFee.toLocaleString()}`,
        otherFees: `₦${otherFees.toLocaleString()}`,
        totalFees: `₦${totalFees.toLocaleString()}`
      },
      discounts: `₦${discounts.toLocaleString()}`,
      calculation: `₦${subtotal.toLocaleString()} + ₦${taxes.toLocaleString()} + ₦${totalFees.toLocaleString()} - ₦${discounts.toLocaleString()} = ₦${total.toLocaleString()}`,
      total: `₦${total.toLocaleString()}`,
      balance: `₦${balance.toLocaleString()}`,
      paid: `₦${(pricing.paid || 0).toLocaleString()}`
    });

    this.taxAmount.set(taxes);
    this.discountAmount.set(discounts);
    this.totalAmount.set(Math.max(0, total));

    this.reservationForm.get('pricing.total')?.setValue(total);
    this.reservationForm.get('pricing.balance')?.setValue(balance);
  }

  private updateRoomCapacityLimits() {
    const selectedRooms = this.rooms.value;
    const availableRooms = this.availableRooms();
    
    let totalMaxAdults = 0;
    let totalMaxChildren = 0;
    const roomDetails: AvailableRoom[] = [];

    selectedRooms.forEach((roomSelection: any) => {
      if (roomSelection.roomId) {
        const room = availableRooms.find(r => r._id === roomSelection.roomId || r.id === roomSelection.roomId);
        if (room) {
          // Get capacity in a flexible way to handle both formats
          let capacity = this.getRoomCapacityObject(room);
          
          if (capacity) {
            totalMaxAdults += capacity.adults || 0;
            totalMaxChildren += capacity.children || 0;
          }
          roomDetails.push(room);
        }
      }
    });

    this.maxAdultsAllowed.set(totalMaxAdults);
    this.maxChildrenAllowed.set(totalMaxChildren);
    this.selectedRoomDetails.set(roomDetails);

    // Update validation for guest counts
    this.updateGuestCountValidation();
    
    // Remove excess additional guests if room capacity decreased
    this.enforceAdditionalGuestsLimit();
  }

  // Helper method to get capacity object from room data
  private getRoomCapacityObject(room: AvailableRoom): { adults: number; children: number } | null {
    // Check if room has its own capacity
    if (room.capacity) {
      // If capacity is already an object with adults/children
      if (typeof room.capacity === 'object' && 'adults' in room.capacity) {
        return room.capacity;
      }
      // If capacity is a number, assume it's for adults only
      if (typeof room.capacity === 'number') {
        return { adults: room.capacity, children: 0 };
      }
    }
    
    // Fall back to roomType capacity if available
    if (typeof room.roomType === 'object' && room.roomType.capacity) {
      if (typeof room.roomType.capacity === 'object') {
        return room.roomType.capacity;
      }
      // If roomType capacity is also a number
      if (typeof room.roomType.capacity === 'number') {
        return { adults: room.roomType.capacity, children: 0 };
      }
    }
    
    // Final fallback - check maxOccupancy
    if (room.maxOccupancy && typeof room.maxOccupancy === 'number') {
      return { adults: room.maxOccupancy, children: 0 };
    }
    
    return null;
  }

  private enforceAdditionalGuestsLimit() {
    const maxAdditionalGuests = this.getMaxAdditionalGuestsAllowed();
    const currentAdditionalGuests = this.additionalGuests.length;
    
    if (currentAdditionalGuests > maxAdditionalGuests) {
      // Remove excess additional guests from the end
      const excessCount = currentAdditionalGuests - maxAdditionalGuests;
      for (let i = 0; i < excessCount; i++) {
        this.additionalGuests.removeAt(this.additionalGuests.length - 1);
      }
    }
  }

  private updateGuestCountValidation() {
    const totalAdultsControl = this.reservationForm.get('guestDetails.totalAdults');
    const totalChildrenControl = this.reservationForm.get('guestDetails.totalChildren');
    
    if (totalAdultsControl && this.maxAdultsAllowed() > 0) {
      totalAdultsControl.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(this.maxAdultsAllowed())
      ]);
      totalAdultsControl.updateValueAndValidity();
    }

    if (totalChildrenControl && this.maxChildrenAllowed() > 0) {
      totalChildrenControl.setValidators([
        Validators.min(0),
        Validators.max(this.maxChildrenAllowed())
      ]);
      totalChildrenControl.updateValueAndValidity();
    }
  }

  private calculatePricingFromRooms() {
    console.log('🏨 calculatePricingFromRooms() CALLED - checking if this corrupts discount...');
    
    const selectedRooms = this.rooms.value;
    const availableRooms = this.availableRooms();
    const nights = this.numberOfNights();
    
    // 🔍 DEBUG: Check discount value BEFORE any changes
    const discountBefore = this.reservationForm.get('pricing.discounts.amount')?.value;
    console.log('💰 DISCOUNT VALUE BEFORE ROOM PRICING:', discountBefore);
    
    console.log('calculatePricingFromRooms called:', {
      selectedRooms,
      availableRoomsCount: availableRooms.length,
      nights
    });
    
    if (nights === 0) {
      console.log('No nights calculated, skipping pricing calculation');
      return;
    }

    let subtotal = 0;
    
    selectedRooms.forEach((roomSelection: any, index: number) => {
      if (roomSelection.roomId) {
        console.log(`Processing room selection ${index}:`, roomSelection);
        
        // Try to find room by _id first, then by id
        const room = availableRooms.find(r => 
          r._id === roomSelection.roomId || r.id === roomSelection.roomId
        );
        
        if (room) {
          const roomRate = this.getRoomRate(room);
          const roomTotal = roomRate * nights;
          console.log(`Found room:`, {
            roomNumber: room.roomNumber,
            roomId: room._id || room.id,
            roomRate,
            nights,
            roomTotal
          });
          subtotal += roomTotal;
        } else {
          console.log(`Room not found for ID: ${roomSelection.roomId}`);
          console.log('Available room IDs:', availableRooms.map(r => ({ id: r.id, _id: r._id })));
        }
      }
    });

    console.log('Final pricing calculation:', {
      subtotal,
      nights,
      selectedRoomsCount: selectedRooms.length
    });

    // Calculate taxes using store tax rate
    const store = this.storeStore.selectedStore();
    const taxRate = store?.tax ? store.tax / 100 : 0; // Convert percentage to decimal
    const taxes = subtotal * taxRate;

    console.log('Tax calculation:', { storeTax: store?.tax, taxRate, taxes });

    // 🔧 FIX: Preserve existing pricing values when updating from rooms
    const currentPricing = this.reservationForm.get('pricing')?.value || {};
    
    // Update pricing form - PRESERVE existing discounts, fees, and other values
    this.reservationForm.patchValue({
      pricing: {
        ...currentPricing,  // Preserve all existing pricing values
        subtotal: subtotal, // Only update subtotal
        taxes: taxes        // Only update taxes  
      }
    });

    console.log('🔧 PRESERVED PRICING VALUES:', {
      preserved: currentPricing,
      newSubtotal: subtotal,
      newTaxes: taxes,
      preservedDiscount: currentPricing.discounts?.amount
    });

    // 🔍 DEBUG: Check discount value AFTER patchValue
    const discountAfter = this.reservationForm.get('pricing.discounts.amount')?.value;
    console.log('💰 DISCOUNT VALUE AFTER ROOM PRICING:', {
      before: currentPricing.discounts?.amount,
      after: discountAfter,
      changed: currentPricing.discounts?.amount !== discountAfter
    });

    // Trigger total calculation and change detection
    this.calculateTotal();
    this.cdr.markForCheck();
  }

  private searchAvailableRooms() {
    const checkIn = this.reservationForm.get('checkInDate')?.value;
    const checkOut = this.reservationForm.get('checkOutDate')?.value;
    const storeId = this.storeStore.selectedStore()?._id;

    if (!checkIn || !checkOut || !storeId) {
      return;
    }

    this.roomSearchLoading.set(true);
    this.availableRooms.set([]);

    // Format dates to ISO string format (YYYY-MM-DD)
    const checkInDate = new Date(checkIn).toISOString().split('T')[0];
    const checkOutDate = new Date(checkOut).toISOString().split('T')[0];
    
    this.roomsService.getAvailableRooms({
      storeId: storeId,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rooms) => {
          this.availableRooms.set(rooms);
          this.roomSearchLoading.set(false);
          console.log('Available rooms loaded:', rooms);
          console.log('Current form rooms after loading:', this.rooms.value);
          
          // If we're in edit mode, force UI update to show selected rooms
          if (this.isEditing()) {
            console.log('Edit mode detected, triggering UI updates');
            
            // Force the room selection UI to update
            setTimeout(() => {
              console.log('Forcing change detection for room selection UI');
              this.cdr.detectChanges();
              
              // Additional debugging for room selection
              this.rooms.controls.forEach((control, index) => {
                const roomId = control.get('roomId')?.value;
                const room = rooms.find((r: any) => r._id === roomId || r.id === roomId);
                console.log(`Room ${index}: ID=${roomId}, Found=${!!room}, RoomNumber=${room?.roomNumber}`);
              });
            }, 100);
          }
        },
        error: (error) => {
          console.error('Error fetching available rooms:', error);
          this.roomSearchLoading.set(false);
          this.snackBar.open('Failed to load available rooms', 'Close', { duration: 3000 });
          // Set empty array on error
          this.availableRooms.set([]);
        }
      });
  }

  // Room selection methods
  isRoomSelected(room: AvailableRoom): boolean {
    const roomId = room._id || room.id;
    const selectedRoomIds = this.rooms.controls.map(control => control.get('roomId')?.value);
    const isSelected = selectedRoomIds.includes(roomId);
    
    // Debug logging for room selection
    if (this.isEditing()) {
      console.log(`Checking if room ${roomId} (${room.roomNumber}) is selected:`, {
        isSelected,
        selectedRoomIds,
        roomsControlsLength: this.rooms.controls.length,
        roomsValue: this.rooms.value
      });
    }
    
    return isSelected;
  }

  toggleRoomSelection(room: AvailableRoom): void {
    console.log('toggleRoomSelection called with room:', room);
    console.log('isRoomAvailable:', this.isRoomAvailable(room));
    
    if (!this.isRoomAvailable(room)) {
      console.log('Room not available, returning early');
      return; // Don't allow selection of unavailable rooms
    }
    
    const roomId = room._id || room.id;
    console.log('Room ID:', roomId);
    
    const existingIndex = this.rooms.controls.findIndex(control => 
      control.get('roomId')?.value === roomId
    );
    
    console.log('Existing index:', existingIndex);
    console.log('Current rooms.controls length:', this.rooms.controls.length);

    if (existingIndex >= 0) {
      // Room is selected, remove it
      console.log('Removing room at index:', existingIndex);
      this.rooms.removeAt(existingIndex);
    } else {
      // Room is not selected, add it
      console.log('Adding new room');
      const newRoomForm = this.createRoomForm();
      newRoomForm.patchValue({ roomId: roomId });
      this.rooms.push(newRoomForm);
      console.log('Room added, new length:', this.rooms.controls.length);
    }

    // Update step validation and trigger change detection
    this.updateStepValidation();
    this.rooms.markAsTouched();
    this.rooms.updateValueAndValidity();
    
    // Also update the parent form group
    this.reservationForm.updateValueAndValidity();
    
    // Update capacity limits and pricing
    this.updateRoomCapacityLimits();
    this.calculatePricingFromRooms();
    
    console.log('Final rooms count:', this.getSelectedRoomsCount());
  }

  private updateStepValidation(): void {
    const hasRoomsSelected = this.getSelectedRoomsCount() > 0;
    this.reservationDetailsGroup.get('roomsSelected')?.setValue(hasRoomsSelected);
  }

  getSelectedRoomsCount(): number {
    return this.rooms.length;
  }

  getSelectedRoomsDetails(): any[] {
    const availableRooms = this.availableRooms();
    return this.rooms.controls
      .map(control => {
        const roomId = control.get('roomId')?.value;
        return availableRooms.find(room => room.id === roomId);
      })
      .filter(room => room);
  }

  // Form array management
  get rooms(): FormArray {
    return this.reservationForm.get('rooms') as FormArray;
  }

  get additionalGuests(): FormArray {
    return this.reservationForm.get('guestDetails.additionalGuests') as FormArray;
  }

  createAdditionalGuestForm(): FormGroup {
    return this.fb.group({
      firstName: [''],
      lastName: [''],
      age: [null],
      relationship: ['']
    });
  }

  addAdditionalGuest() {
    if (this.canAddMoreAdditionalGuests()) {
      this.additionalGuests.push(this.createAdditionalGuestForm());
    }
  }

  removeAdditionalGuest(index: number) {
    this.additionalGuests.removeAt(index);
  }

  canAddMoreAdditionalGuests(): boolean {
    const maxAdults = this.maxAdultsAllowed();
    const currentTotalAdults = this.reservationForm.get('guestDetails.totalAdults')?.value || 1;
    const currentAdditionalGuests = this.additionalGuests.length;
    
    // Additional guests count should not exceed (maxAdults - 1) because we already have the primary guest
    const maxAdditionalGuests = Math.max(0, maxAdults - 1);
    
    return currentAdditionalGuests < maxAdditionalGuests && maxAdults > 0;
  }

  getMaxAdditionalGuestsAllowed(): number {
    const maxAdults = this.maxAdultsAllowed();
    return Math.max(0, maxAdults - 1); // -1 for primary guest
  }

  getAdditionalGuestsWarningMessage(): string {
    const maxAdditional = this.getMaxAdditionalGuestsAllowed();
    if (maxAdditional === 0) {
      return 'Selected rooms only accommodate the primary guest';
    }
    return `Selected rooms can accommodate maximum ${maxAdditional} additional guest(s)`;
  }

  get currency(): string {
    return this.storeStore.selectedStore()?.currencyCode || 
           this.storeStore.selectedStore()?.currency || '$';
  }

  // Step validation methods
  isStepOneComplete(): boolean {
    const checkInDate = this.reservationForm.get('checkInDate')?.valid;
    const checkOutDate = this.reservationForm.get('checkOutDate')?.valid;
    const hasSelectedRooms = this.getSelectedRoomsCount() > 0;
    
    return !!(checkInDate && checkOutDate && hasSelectedRooms);
  }

  isStepTwoComplete(): boolean {
    return this.reservationForm.get('guestDetails')?.valid || false;
  }

  isStepThreeComplete(): boolean {
    return this.reservationForm.get('pricing')?.valid || false;
  }

  // Form submission
  onSubmit() {
    if (this.reservationForm.valid) {
      const formData = this.reservationForm.getRawValue();
      
      // Additional validation for schema requirements
      const store = this.storeStore.selectedStore();
      const currentUser = this.currentUser();
      
      if (!store?._id) {
        this.snackBar.open('No store selected. Please select a store first.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }
      
      if (!currentUser?._id) {
        this.snackBar.open('User not authenticated. Please log in again.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }
      
      if (!formData.rooms || formData.rooms.length === 0) {
        this.snackBar.open('Please select at least one room.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }
      
      if (!formData.guestDetails?.primaryGuest?.firstName || !formData.guestDetails?.primaryGuest?.email) {
        this.snackBar.open('Please provide guest information.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      // Handle guest creation/selection logic
      this.handleGuestAndCreateReservation(formData);
    } else {
      this.markFormGroupTouched(this.reservationForm);
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private handleGuestAndCreateReservation(formData: any) {
    const selectedGuest = this.selectedGuest();
    
    if (selectedGuest?._id) {
      // Existing guest selected - use their ID directly
      console.log('Using existing guest:', selectedGuest);
      const reservationData = this.transformFormToReservationDto(formData, selectedGuest._id);
      
      if (this.isEditing()) {
        this.updateReservation(reservationData);
      } else {
        this.createReservation(reservationData);
      }
    } else {
      // No guest selected - create new guest first
      console.log('Creating new guest first');
      const currentStoreId = this.storeStore.selectedStore()?._id;
      const guestData = {
        firstName: formData.guestDetails.primaryGuest.firstName,
        lastName: formData.guestDetails.primaryGuest.lastName,
        email: formData.guestDetails.primaryGuest.email,
        phone: formData.guestDetails.primaryGuest.phone,
        stores: currentStoreId ? [currentStoreId] : [] // Add current store ID if it exists
      };
      
      this.loading.set(true);
      this.guestService.createGuest(guestData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newGuest) => {
            console.log('New guest created:', newGuest);
            // Update selected guest
            this.selectedGuest.set(newGuest);
            
            // Now create reservation with the new guest ID
            const reservationData = this.transformFormToReservationDto(formData, newGuest._id);
            
            if (this.isEditing()) {
              this.updateReservation(reservationData);
            } else {
              this.createReservation(reservationData);
            }
          },
          error: (error) => {
            this.loading.set(false);
            console.error('Error creating guest:', error);
            this.snackBar.open('Failed to create guest. Please try again.', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  private transformFormToReservationDto(formData: any, guestId: string): CreateReservationDto {
    const checkInDate = new Date(formData.checkInDate);
    const checkOutDate = new Date(formData.checkOutDate);
    const store = this.storeStore.selectedStore();
    const currentUser = this.currentUser();

    // Calculate numberOfNights (required by schema)
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return {
      // Required by schema
      store: store?._id || '', 
      guest: guestId, // Required ObjectId reference
      createdBy: currentUser?._id || '',
      numberOfNights: numberOfNights, // Required by schema
      
      // Guest details - MISSING from previous payload!
      guestDetails: {
        primaryGuest: formData.guestDetails.primaryGuest,
        additionalGuests: formData.guestDetails.additionalGuests || [],
        totalAdults: formData.guestDetails.totalAdults,
        totalChildren: formData.guestDetails.totalChildren
      },
      
      // Rooms - use 'room' not 'roomId' to match schema
      rooms: formData.rooms.map((room: any) => ({
        room: room.roomId, // Schema expects 'room' field
        guests: {
          adults: room.guests?.adults || formData.guestDetails.totalAdults || 1,
          children: room.guests?.children || formData.guestDetails.totalChildren || 0
        }
      })),
      
      // Dates and times
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      expectedCheckInTime: formData.expectedCheckInTime || '15:00',
      expectedCheckOutTime: formData.expectedCheckOutTime || '11:00',
      
      // Booking details
      bookingSource: formData.bookingSource || 'walk_in',
      
      // Pricing - ensure all required fields are included
      pricing: {
        subtotal: formData.pricing.subtotal || 0,
        taxes: formData.pricing.taxes || 0,
        fees: formData.pricing.fees || {
          serviceFee: 0,
          cleaningFee: 0,
          resortFee: 0,
          other: 0
        },
        discounts: formData.pricing.discounts || {
          amount: 0,
          reason: '',
          code: ''
        },
        total: formData.pricing.total || 0,
        paid: formData.pricing.paid || 0
      },
      
      // Payment information - Include transactions array!
      paymentInfo: {
        method: formData.paymentInfo?.method || 'cash',
        status: formData.paymentInfo?.status || 'pending',
        transactions: formData.paymentInfo?.transactions || [] // Schema expects transactions array
      },
      
      // Additional details
      specialRequests: formData.specialRequests || '',
      internalNotes: formData.internalNotes || ''
    };
  }

  private createReservation(reservationData: CreateReservationDto) {
    console.log('Creating reservation with COMPLETE data structure:');
    console.log('✅ Store:', reservationData.store);
    console.log('✅ Guest:', reservationData.guest);
    console.log('✅ CreatedBy:', reservationData.createdBy);
    console.log('✅ NumberOfNights:', reservationData.numberOfNights);
    console.log('✅ GuestDetails:', reservationData.guestDetails);
    console.log('✅ PaymentInfo with transactions:', reservationData.paymentInfo);
    console.log('FULL PAYLOAD:', JSON.stringify(reservationData, null, 2));
    
    this.loading.set(true);
    this.reservationService.createReservation(reservationData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservation) => {
          this.loading.set(false);
          console.log('Reservation created successfully:', reservation);
          this.snackBar.open('Reservation created successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['../list'], { relativeTo: this.route });
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set('Failed to create reservation');
          console.error('Error creating reservation:', error);
          this.snackBar.open('Failed to create reservation', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private updateReservation(reservationData: CreateReservationDto) {
    const reservationId = this.editingReservation()?._id;
    if (!reservationId) return;

    // Convert CreateReservationDto to UpdateReservationDto structure
    const updateData: UpdateReservationDto = {
      guest: reservationData.guest,
      guestDetails: reservationData.guestDetails, // Include guestDetails
      rooms: reservationData.rooms,
      checkInDate: reservationData.checkInDate,
      checkOutDate: reservationData.checkOutDate,
      numberOfNights: reservationData.numberOfNights,
      expectedCheckInTime: reservationData.expectedCheckInTime,
      expectedCheckOutTime: reservationData.expectedCheckOutTime,
      pricing: reservationData.pricing,
      paymentInfo: reservationData.paymentInfo, // Include transactions
      specialRequests: reservationData.specialRequests,
      internalNotes: reservationData.internalNotes
    };

    this.loading.set(true);
    this.reservationService.updateReservation(reservationId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservation) => {
          this.loading.set(false);
          this.snackBar.open('Reservation updated successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['../list'], { relativeTo: this.route });
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set('Failed to update reservation');
          this.snackBar.open('Failed to update reservation', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Helper methods for template access to room capacity
  getRoomAdultCapacity(room: AvailableRoom): number {
    const capacity = this.getRoomCapacityObject(room);
    return capacity?.adults || 0;
  }

  getRoomChildrenCapacity(room: AvailableRoom): number {
    const capacity = this.getRoomCapacityObject(room);
    return capacity?.children || 0;
  }

  getRoomAmenities(room: AvailableRoom): string[] {
    // Room-specific amenities take precedence over roomType amenities
    if (room.amenities && room.amenities.length > 0) {
      return room.amenities;
    }
    // Fall back to roomType amenities if room is populated and has amenities
    if (typeof room.roomType === 'object' && room.roomType.amenities) {
      return room.roomType.amenities;
    }
    return [];
  }

  getRoomTypeName(room: AvailableRoom): string {
    // Get room type name from the roomType property
    if (typeof room.roomType === 'object' && room.roomType.name) {
      return room.roomType.name;
    }
    // If roomType is just a string ID, return a fallback
    return typeof room.roomType === 'string' ? 'Room Type' : 'Unknown';
  }

  isRoomAvailable(room: AvailableRoom): boolean {
    // Check if room is available based on status and active properties
    // The AvailableRoom interface expects isAvailable, but the API returns status and active
    if ('isAvailable' in room) {
      return room.isAvailable;
    }
    // Fallback to checking status and active properties from the Room interface
    const roomData = room as any; // Type assertion to access Room properties
    return roomData.status === 'available' && roomData.active === true;
  }

  getRoomRate(room: AvailableRoom): number {
    // Get room rate - check for rate property first, then priceOverride, then roomType basePrice
    if ('rate' in room && room.rate) {
      return room.rate;
    }
    if (room.priceOverride) {
      return room.priceOverride;
    }
    if (typeof room.roomType === 'object' && room.roomType.basePrice) {
      return room.roomType.basePrice;
    }
    return 0;
  }

  private setupGuestAutocomplete() {
    this.guestSearchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(searchTerm => {
          if (!searchTerm || searchTerm.length < 2) {
            this.filteredGuests.set([]);
            return of({ guests: [], total: 0, page: 1, totalPages: 0 });
          }
          
          this.guestSearchLoading.set(true);
          const storeId = this.storeStore.selectedStore()?._id;
          return this.guestService.searchGuests(searchTerm, 1, 10, storeId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.filteredGuests.set(response.guests);
          this.guestSearchLoading.set(false);
        },
        error: (error) => {
          console.error('Error searching guests:', error);
          this.filteredGuests.set([]);
          this.guestSearchLoading.set(false);
        }
      });
  }

  // Guest search functionality
  onGuestSelected(guest: Guest) {
    this.selectedGuest.set(guest);
    this.guestSearchControl.setValue(`${guest.firstName} ${guest.lastName}`);
    this.populateGuestDetails(guest);
  }

  displayGuestFn(guest: Guest): string {
    return guest ? `${guest.firstName} ${guest.lastName}` : '';
  }

  getGuestDisplayText(guest: Guest): string {
    return `${guest.firstName} ${guest.lastName} • ${guest.phone}`;
  }

  private populateGuestDetails(guest: Guest) {
    const guestForm = this.reservationForm.get('guestDetails.primaryGuest');
    if (guestForm) {
      guestForm.patchValue({
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        phone: guest.phone,
        dateOfBirth: guest.dateOfBirth,
        nationality: guest.nationality
      });
    }

    // Store the guest ID for when creating the reservation
    this.reservationForm.patchValue({
      guest: guest._id
    });

    this.snackBar.open(`Guest ${guest.firstName} ${guest.lastName} selected`, 'Close', { duration: 3000 });
  }

  onGuestSearchClear() {
    this.selectedGuest.set(null);
    this.guestSearchControl.setValue('');
    this.filteredGuests.set([]);
    
    // Clear the guest form
    const guestForm = this.reservationForm.get('guestDetails.primaryGuest');
    if (guestForm) {
      guestForm.patchValue({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: null,
        nationality: ''
      });
    }

    // Clear the guest ID
    this.reservationForm.patchValue({
      guest: null
    });
  }

  // Navigation
  onCancel() {
    this.location.back();
  }

  clearError() {
    this.error.set(null);
  }

  // Helper method to force UI refresh for edit mode
  private forceUIRefresh() {
    console.log('Forcing UI refresh...');
    
    // Force all form arrays to update their validity
    this.rooms.updateValueAndValidity();
    this.additionalGuests.updateValueAndValidity();
    
    // Force change detection
    this.cdr.detectChanges();
    
    // Log current state for debugging
    console.log('UI refresh - Additional guests:', {
      length: this.additionalGuests.length,
      value: this.additionalGuests.value
    });
    
    console.log('UI refresh - Selected rooms:', {
      length: this.rooms.length,
      value: this.rooms.value
    });
  }
}