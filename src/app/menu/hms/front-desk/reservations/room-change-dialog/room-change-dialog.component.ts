import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatOptionModule } from '@angular/material/core';
import { Subscription } from 'rxjs';
import { RoomsService } from '../../../../../shared/services/rooms.service';
import { ReservationService } from '../../../../../shared/services/reservation.service';
import { StoreService } from '../../../../../shared/services/store.service';

export interface RoomChangeDialogData {
  reservationId: string;
  currentRooms: any[];
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  currency: string;
}

export interface RoomSwapPair {
  currentRoom: any;
  replacementRoom: any | null;
  priceDifference: number;
}

export interface RoomChangeResult {
  mode: 'swap';
  newRooms: any[];
  swapPairs: RoomSwapPair[];
  pricingAdjustment: {
    oldTotal: number;
    newTotal: number;
    difference: number;
    requiresPayment: boolean;
    refundAmount?: number;
  };
  reason: string;
  suggestedInternalNote: string;
  roomMapping: any[];
}

@Component({
  selector: 'app-room-change-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatOptionModule
  ],
  templateUrl: './room-change-dialog.component.html'
})
export class RoomChangeDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<RoomChangeDialogComponent>);
  private fb = inject(FormBuilder);
  private roomsService = inject(RoomsService);
  private reservationService = inject(ReservationService);
  private storeService = inject(StoreService);
  private snackBar = inject(MatSnackBar);
  
  data: RoomChangeDialogData = inject(MAT_DIALOG_DATA);

  private subscriptions = new Subscription();

  roomChangeForm: FormGroup = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(10)]]
  });

  availableRooms = signal<any[]>([]);
  loadingRooms = signal(true);
  submitting = signal(false);
  formValid = signal(false); // Track form validity as a signal

  // Swap pairs for room swapping
  swapPairs = signal<RoomSwapPair[]>([]);
  selectedCurrentRooms = signal<any[]>([]);

  // Computed values
  currentTotal = computed(() => {
    // Always show the full current reservation total
    const total = this.data.currentRooms.reduce((total, room) => {
      const roomCost = this.getRoomTotalCost(room);
      console.log('Current room cost calculation:', {
        room: room,
        roomRate: this.getRoomRate(room),
        nights: this.data.numberOfNights,
        totalCost: roomCost
      });
      return total + roomCost;
    }, 0);
    
    console.log('Current total calculated:', total);
    return total;
  });

  newTotal = computed(() => {
    // Calculate total with swaps applied
    const currentRoomTotal = this.currentTotal();
    
    // Calculate adjustment from swaps  
    const swapAdjustment = this.swapPairs().reduce((total, pair) => {
      return total + pair.priceDifference;
    }, 0);

    return currentRoomTotal + swapAdjustment;
  });

  priceDifference = computed(() => {
    // Calculate difference from swaps
    return this.swapPairs().reduce((total, pair) => {
      return total + pair.priceDifference;
    }, 0);
  });

  hasValidSelections = computed(() => {
    return this.swapPairs().some(pair => pair.replacementRoom !== null);
  });

  // Form is valid when we have valid reason and all swap pairs have replacements
  canSubmit = computed(() => {
    // Use the signal for form validity
    const formValid = this.formValid();
    const isSubmitting = this.submitting();
    const swaps = this.swapPairs();
    
    console.log('canSubmit check:', {
      formValid,
      isSubmitting,
      swapPairsCount: swaps.length,
      swapPairs: swaps,
      allHaveReplacements: swaps.every(pair => pair.replacementRoom !== null)
    });
    
    if (!formValid || isSubmitting) {
      return false;
    }
    
    // Must have at least one swap pair
    if (swaps.length === 0) {
      return false;
    }
    
    // All pairs must have replacement rooms selected
    const allPairsComplete = swaps.every(pair => pair.replacementRoom !== null);
    
    return allPairsComplete;
  });

  // Template helper methods
  Math = Math;

  compareRooms(room1: any, room2: any): boolean {
    return room1 && room2 && room1._id === room2._id;
  }

  findOriginalReservationRoom(roomId: string) {
    return this.data.currentRooms.find(room => room.room._id === roomId);
  }

  ngOnInit() {
    console.log('Current rooms data structure:', this.data.currentRooms);
    this.loadAvailableRooms();
    
    // Subscribe to form changes to trigger validation updates
    this.subscriptions.add(
      this.roomChangeForm.valueChanges.subscribe(() => {
        this.formValid.set(this.roomChangeForm.valid);
        console.log('Form value changed:', {
          valid: this.roomChangeForm.valid,
          value: this.roomChangeForm.value
        });
      })
    );
    
    // Also subscribe to status changes
    this.subscriptions.add(
      this.roomChangeForm.statusChanges.subscribe(() => {
        this.formValid.set(this.roomChangeForm.valid);
        console.log('Form status changed:', {
          valid: this.roomChangeForm.valid,
          status: this.roomChangeForm.status
        });
      })
    );
    
    // Set initial validity
    this.formValid.set(this.roomChangeForm.valid);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadAvailableRooms() {
    try {
      this.loadingRooms.set(true);
      
      const store = this.storeService.getStoreLocally;
      if (!store) {
        throw new Error('No store selected');
      }

      // Get available rooms for the reservation dates
      const response = await this.roomsService.getAvailableRooms({
        storeId: store._id,
        checkInDate: this.data.checkInDate,
        checkOutDate: this.data.checkOutDate,
        excludeReservationId: this.data.reservationId
      }).toPromise();

      // Include current rooms in available options
      const currentRoomsAsAvailable = this.data.currentRooms.map(r => r.room);
      
      // Combine and deduplicate (response is now an array directly)
      const allRooms = [...(response || []), ...currentRoomsAsAvailable];
      const uniqueRooms = allRooms.filter((room, index, self) => 
        index === self.findIndex(r => r._id === room._id)
      );

      this.availableRooms.set(uniqueRooms);
    } catch (error) {
      console.error('Error loading available rooms:', error);
      this.snackBar.open('Failed to load available rooms', 'Close', { duration: 3000 });
    } finally {
      this.loadingRooms.set(false);
    }
  }

  getRoomTotalCost(room: any): number {
    // Calculate total cost as rate * number of nights (matching reservation details logic)
    const baseRate = this.getRoomRate(room);
    return baseRate * this.data.numberOfNights;
  }

  getRoomRate(room: any): number {
    let rate = 0;
    let source = '';

    // PRIORITY 1: Check for priceOverride first (handle null values properly)
    if (room.priceOverride !== null && room.priceOverride !== undefined && typeof room.priceOverride === 'number') {
      rate = room.priceOverride;
      source = 'room.priceOverride';
    }
    // PRIORITY 2: Handle reservation room structure (like in reservation details)
    else if (room.rate && typeof room.rate === 'number') {
      rate = room.rate;
      source = 'room.rate';
    }
    // PRIORITY 3: Handle nested room structure for reservation rooms
    else if (room.room && typeof room.room === 'object') {
      // Check for priceOverride first (handle null values)
      if (room.room.priceOverride !== null && room.room.priceOverride !== undefined && typeof room.room.priceOverride === 'number') {
        rate = room.room.priceOverride;
        source = 'room.room.priceOverride';
      }
      // Fall back to room type pricing
      else if (room.room.roomType?.basePrice) {
        rate = room.room.roomType.basePrice;
        source = 'room.room.roomType.basePrice';
      }
      else if (room.room.roomType?.baseRate) {
        rate = room.room.roomType.baseRate;
        source = 'room.room.roomType.baseRate';
      }
    }
    // PRIORITY 4: Handle room type pricing as fallback
    else if (room.roomType?.basePrice) {
      rate = room.roomType.basePrice;
      source = 'room.roomType.basePrice';
    }
    else if (room.roomType?.baseRate) {
      rate = room.roomType.baseRate;
      source = 'room.roomType.baseRate';
    }

    console.log('Room rate lookup:', {
      roomNumber: room.roomNumber || room.room?.roomNumber,
      roomId: room._id || room.room?._id,
      rate,
      source,
      roomStructure: {
        hasRate: !!room.rate,
        priceOverride: room.priceOverride,
        priceOverrideType: typeof room.priceOverride,
        priceOverrideIsNull: room.priceOverride === null,
        hasNestedRoom: !!room.room,
        nestedPriceOverride: room.room?.priceOverride,
        nestedPriceOverrideType: typeof room.room?.priceOverride,
        roomTypeBasePrice: room.roomType?.basePrice || room.room?.roomType?.basePrice
      }
    });
    
    if (rate === 0) {
      console.warn('No room rate found for room:', room);
    }
    
    return rate;
  }

  isRoomSelected(roomId: string): boolean {
    // Room is selected if it's part of any swap pair
    return this.swapPairs().some(pair => {
      const pairRoomId = pair.currentRoom.room?._id || pair.currentRoom._id;
      return pairRoomId === roomId;
    });
  }

  isCurrentRoomSelected(roomId: string): boolean {
    return this.selectedCurrentRooms().some((r: any) => r._id === roomId);
  }

  toggleCurrentRoomForSwap(room: any, selected: boolean) {
    console.log('Toggle room swap - Room:', room._id, 'Selected:', selected);
    
    const current = this.selectedCurrentRooms();
    
    if (selected) {
      if (!current.some(r => r._id === room._id)) {
        this.selectedCurrentRooms.set([...current, room]);
        
        // Check if swap pair already exists
        const existingPair = this.swapPairs().find(p => {
          const pairRoomId = p.currentRoom.room?._id || p.currentRoom._id;
          return pairRoomId === room._id;
        });
        
        if (!existingPair) {
          const reservationRoom = this.data.currentRooms.find(r => r.room._id === room._id);
          const newPair: RoomSwapPair = {
            currentRoom: reservationRoom || { room: room },
            replacementRoom: null,
            priceDifference: 0
          };
          this.swapPairs.set([...this.swapPairs(), newPair]);
          console.log('Created new swap pair for room:', room._id);
        }
      }
    } else {
      this.selectedCurrentRooms.set(current.filter(r => r._id !== room._id));
      
      // Remove swap pair
      const updatedPairs = this.swapPairs().filter(p => {
        const pairRoomId = p.currentRoom.room?._id || p.currentRoom._id;
        return pairRoomId !== room._id;
      });
      this.swapPairs.set(updatedPairs);
      console.log('Removed swap pair for room:', room._id);
    }
    
    // Force change detection by updating form status
    this.roomChangeForm.updateValueAndValidity();
  }

  assignReplacementRoom(currentRoomId: string, replacementRoom: any) {
    console.log('=== ASSIGNING REPLACEMENT ROOM ===');
    console.log('Current Room ID:', currentRoomId);
    console.log('Replacement Room Object:', replacementRoom);
    
    const pairs = this.swapPairs().map(pair => {
      const roomId = pair.currentRoom.room?._id || pair.currentRoom._id;
      if (roomId === currentRoomId) {
        const oldRate = this.getRoomRate(pair.currentRoom);
        const newRate = this.getRoomRate(replacementRoom);
        const oldCost = oldRate * this.data.numberOfNights;
        const newCost = newRate * this.data.numberOfNights;
        const difference = newCost - oldCost;
        
        console.log('✅ Swap calculation:', {
          currentRoomId: roomId,
          oldRate,
          newRate,
          difference,
          nights: this.data.numberOfNights
        });
        
        return {
          ...pair,
          replacementRoom,
          priceDifference: difference
        };
      }
      return pair;
    });
    
    this.swapPairs.set(pairs);
    
    // Force change detection
    this.roomChangeForm.updateValueAndValidity();
  }

  removeSwapPair(currentRoomId: string) {
    this.swapPairs.set(this.swapPairs().filter(p => {
      const roomId = p.currentRoom.room?._id || p.currentRoom._id;
      return roomId !== currentRoomId;
    }));
    this.selectedCurrentRooms.set(this.selectedCurrentRooms().filter((r: any) => r._id !== currentRoomId));
  }

  getSwapPairForCurrentRoom(roomId: string): RoomSwapPair | undefined {
    return this.swapPairs().find(pair => pair.currentRoom._id === roomId);
  }

  isReplacementRoomUsed(roomId: string): boolean {
    return this.swapPairs().some(pair => pair.replacementRoom?._id === roomId);
  }

  getAvailableRoomsForSwap(): any[] {
    // Filter out rooms that are already used as replacements
    const usedRoomIds = this.swapPairs()
      .map(pair => pair.replacementRoom?._id)
      .filter(Boolean);
    
    return this.availableRooms().filter(room => !usedRoomIds.includes(room._id));
  }

  getAvailableRoomsForSpecificSwap(currentRoomId: string): any[] {
    // Get the current room ID to exclude it from its own replacement options
    const currentRoom = this.selectedCurrentRooms().find(room => room._id === currentRoomId);
    
    // Filter out rooms that are already used as replacements by other pairs
    const usedRoomIds = this.swapPairs()
      .filter(pair => {
        const pairRoomId = pair.currentRoom.room?._id || pair.currentRoom._id;
        return pairRoomId !== currentRoomId; // Don't count current pair's replacement
      })
      .map(pair => pair.replacementRoom?._id)
      .filter(Boolean);
    
    return this.availableRooms().filter(room => 
      !usedRoomIds.includes(room._id) && // Not used by other pairs
      room._id !== currentRoomId // Cannot swap room with itself
    );
  }

  async onSubmit() {
    if (!this.canSubmit()) return;

    try {
      this.submitting.set(true);

      // Validate swap pairs - ensure no room is being swapped with itself
      const invalidSwaps = this.swapPairs().filter(pair => {
        const currentRoomId = pair.currentRoom.room?._id || pair.currentRoom._id;
        const replacementRoomId = pair.replacementRoom?._id;
        return currentRoomId === replacementRoomId;
      });

      if (invalidSwaps.length > 0) {
        this.snackBar.open('Cannot swap a room with itself. Please select different rooms.', 'Close', { duration: 5000 });
        return;
      }

      console.log('=== SWAP PAIRS DEBUG ===');
      console.log('Original swap pairs:', this.swapPairs());

      // Convert swap pairs to newRooms format with enhanced room information
      const newRooms = this.swapPairs().map(pair => {
        const currentRoom = pair.currentRoom.room || pair.currentRoom;
        const replacementRoom = pair.replacementRoom;
        
        return {
          currentRoomId: pair.currentRoom._id || currentRoom._id,
          room: replacementRoom._id,
          guests: pair.currentRoom.guests || { adults: 1, children: 0 },
          // Enhanced room information for backend
          currentRoomDetails: {
            roomNumber: currentRoom.roomNumber,
            name: currentRoom.name,
            rate: this.getRoomRate(pair.currentRoom)
          },
          newRoomDetails: {
            roomNumber: replacementRoom.roomNumber,
            name: replacementRoom.name,
            rate: this.getRoomRate(replacementRoom),
            priceOverride: replacementRoom.priceOverride
          },
          priceDifference: pair.priceDifference
        };
      });

      console.log('New rooms array for swap mode:', newRooms);

      // Generate detailed internal note for backend
      const swapSummary = this.swapPairs().map(pair => {
        const currentRoom = pair.currentRoom.room || pair.currentRoom;
        const replacementRoom = pair.replacementRoom;
        const currency = this.data.currency;
        
        return `Room ${currentRoom.roomNumber} (${currentRoom.name}) → Room ${replacementRoom.roomNumber} (${replacementRoom.name}). ` +
               `Price difference: ${currency}${pair.priceDifference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }).join('; ');
      
      const detailedNote = `Room swap completed. ${swapSummary}. Reason: ${this.roomChangeForm.get('reason')?.value}`;
      
      console.log('Generated internal note:', detailedNote);
      console.log('Swap summary details:', swapSummary);

      // Swap mode result - use same structure as bulk mode with enhanced details
      const result: RoomChangeResult = {
        mode: 'swap',
        newRooms: newRooms, // Backend expects this property name
        swapPairs: this.swapPairs(), // Keep for additional context
        pricingAdjustment: {
          oldTotal: this.currentTotal(),
          newTotal: this.newTotal(),
          difference: this.priceDifference(),
          requiresPayment: this.priceDifference() > 0,
          refundAmount: this.priceDifference() < 0 ? Math.abs(this.priceDifference()) : undefined
        },
        reason: this.roomChangeForm.get('reason')?.value,
        // Enhanced internal note suggestion
        suggestedInternalNote: detailedNote,
        // Room mapping for backend to easily create proper notes
        roomMapping: this.swapPairs().map(pair => {
          const currentRoom = pair.currentRoom.room || pair.currentRoom;
          const replacementRoom = pair.replacementRoom;
          return {
            fromRoomId: pair.currentRoom._id || currentRoom._id,
            fromRoomNumber: currentRoom.roomNumber,
            fromRoomName: currentRoom.name,
            toRoomId: replacementRoom._id,
            toRoomNumber: replacementRoom.roomNumber,
            toRoomName: replacementRoom.name,
            priceDifference: pair.priceDifference
          };
        })
      };

      console.log('Final swap mode payload:', result);

      this.dialogRef.close(result);
    } catch (error) {
      console.error('Error submitting room change:', error);
      this.snackBar.open('Failed to process room change', 'Close', { duration: 3000 });
    } finally {
      this.submitting.set(false);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}