import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { RoomsService } from '../../../../../shared/services/rooms.service';
import { StoreService } from '../../../../../shared/services/store.service';
import { AuthService } from '../../../../../shared/services/auth.service';

export interface RoomChangeDialogData {
  reservationId: string;
  currentRooms: any[];           // All rooms in the reservation
  currentRoomIndex?: number;     // Index of room to change (default 0 for single)
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  currency: string;
  actualCheckInDate?: string;
  reservationStatus?: string;
}

export interface RoomChangeResult {
  mode: 'single';
  currentRoom: any;
  newRoom: any;
  newRooms: any[];
  pricingAdjustment: {
    oldTotal: number;
    newTotal: number;
    difference: number;
    requiresPayment: boolean;
    refundAmount?: number;
    nightsConsumed?: number;
    nightsRemaining?: number;
  };
  reason: string;
  effectiveDate?: string;
  suggestedInternalNote: string;
  roomMapping: any[];
  performedBy: string;  // Merchant ID who performed the room change
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
    MatDividerModule,
    MatProgressSpinnerModule,
    MatListModule,
  ],
  templateUrl: './room-change-dialog.component.html'
})
export class RoomChangeDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<RoomChangeDialogComponent>);
  private fb = inject(FormBuilder);
  private roomsService = inject(RoomsService);
  private storeService = inject(StoreService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  
  data: RoomChangeDialogData = inject(MAT_DIALOG_DATA);

  // Form
  roomChangeForm: FormGroup = this.fb.group({
    newRoom: [null, Validators.required],
    reason: ['', [Validators.required, Validators.minLength(10)]]
  });

  // State
  availableRooms = signal<any[]>([]);
  loadingRooms = signal(true);
  submitting = signal(false);
  selectedNewRoom = signal<any>(null);
  formValid = signal(false);

  // Effective date for room change
  effectiveDate = signal<Date>(new Date());

  // The current room being changed (first room or specified index)
  currentRoom = computed(() => {
    const index = this.data.currentRoomIndex ?? 0;
    return this.data.currentRooms[index] || this.data.currentRooms[0];
  });

  // Current room details for display
  currentRoomDetails = computed(() => {
    const room = this.currentRoom();
    const roomData = room?.room || room;
    return {
      roomNumber: roomData?.roomNumber || '—',
      roomName: roomData?.name || '—',
      roomTypeName: roomData?.roomType?.name || room?.roomType?.name || 'Standard',
      rate: this.getRoomRate(room),
    };
  });

  // Calculate nights consumed (past nights that cannot be changed)
  nightsConsumed = computed(() => {
    const checkInDate = new Date(this.data.checkInDate);
    const effective = this.effectiveDate();
    
    if (this.data.reservationStatus !== 'checked_in') {
      return 0;
    }
    
    const actualCheckIn = this.data.actualCheckInDate 
      ? new Date(this.data.actualCheckInDate) 
      : checkInDate;
    
    const diffTime = effective.getTime() - actualCheckIn.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  });

  // Calculate nights remaining
  nightsRemaining = computed(() => {
    const checkOutDate = new Date(this.data.checkOutDate);
    const effective = this.effectiveDate();
    
    const diffTime = checkOutDate.getTime() - effective.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  });

  // Check if mid-stay change
  isMidStayChange = computed(() => this.nightsConsumed() > 0);

  // Current room total cost
  currentRoomCost = computed(() => {
    return this.currentRoomDetails().rate * this.data.numberOfNights;
  });

  // New room rate
  newRoomRate = computed(() => {
    const newRoom = this.selectedNewRoom();
    if (!newRoom) return 0;
    return this.getRoomRate(newRoom);
  });

  // Price difference (based on remaining nights only)
  priceDifference = computed(() => {
    const newRoom = this.selectedNewRoom();
    if (!newRoom) return 0;
    
    const remaining = this.nightsRemaining();
    const oldRate = this.currentRoomDetails().rate;
    const newRate = this.newRoomRate();
    
    return (remaining * newRate) - (remaining * oldRate);
  });

  // New total
  newTotal = computed(() => {
    return this.currentRoomCost() + this.priceDifference();
  });

  // Can submit
  canSubmit = computed(() => {
    return this.formValid() && 
           this.selectedNewRoom() !== null && 
           !this.submitting();
  });

  // Helper for template
  Math = Math;

  ngOnInit() {
    this.loadAvailableRooms();
    
    // Listen to form changes
    this.roomChangeForm.get('newRoom')?.valueChanges.subscribe(room => {
      this.selectedNewRoom.set(room);
    });

    // Track form validity changes
    this.roomChangeForm.statusChanges.subscribe(() => {
      this.formValid.set(this.roomChangeForm.valid);
    });
  }

  async loadAvailableRooms() {
    try {
      this.loadingRooms.set(true);
      
      const store = this.storeService.getStoreLocally;
      if (!store) {
        throw new Error('No store selected');
      }

      const response = await this.roomsService.getAvailableRooms({
        storeId: store._id,
        checkInDate: this.data.checkInDate,
        checkOutDate: this.data.checkOutDate,
        excludeReservationId: this.data.reservationId
      }).toPromise();

      // Filter out the current room
      const currentRoomId = this.currentRoom()?.room?._id || this.currentRoom()?.room;
      const filteredRooms = (response || []).filter((room: any) => room._id !== currentRoomId);

      this.availableRooms.set(filteredRooms);
    } catch (error) {
      console.error('Error loading available rooms:', error);
      this.snackBar.open('Failed to load available rooms', 'Close', { duration: 3000 });
    } finally {
      this.loadingRooms.set(false);
    }
  }

  getRoomRate(room: any): number {
    if (!room) return 0;
    
    // Check pricing.pricePerNight first (reservation room structure)
    if (room.pricing?.pricePerNight) {
      return room.pricing.pricePerNight;
    }
    
    // Check priceOverride
    if (room.priceOverride !== null && room.priceOverride !== undefined && typeof room.priceOverride === 'number') {
      return room.priceOverride;
    }
    
    // Check nested room structure
    if (room.room && typeof room.room === 'object') {
      if (room.room.priceOverride !== null && room.room.priceOverride !== undefined) {
        return room.room.priceOverride;
      }
      if (room.room.roomType?.basePrice) {
        return room.room.roomType.basePrice;
      }
    }
    
    // Check room type pricing
    if (room.roomType?.basePrice) {
      return room.roomType.basePrice;
    }
    
    return 0;
  }

  async onSubmit() {
    if (!this.canSubmit()) return;

    try {
      this.submitting.set(true);

      const currentRoom = this.currentRoom();
      const newRoom = this.selectedNewRoom();
      const currentRoomData = currentRoom?.room || currentRoom;
      const reason = this.roomChangeForm.get('reason')?.value;
      
      const nightsConsumed = this.nightsConsumed();
      const nightsRemaining = this.nightsRemaining();
      const oldRate = this.currentRoomDetails().rate;
      const newRate = this.newRoomRate();
      const roomIndex = this.data.currentRoomIndex ?? 0;

      // Build result for backend - update only the specific room being changed
      const newRooms = this.data.currentRooms.map((room, index) => {
        if (index === roomIndex) {
          // This is the room being changed
          return {
            currentRoomId: room._id || currentRoomData._id,
            room: newRoom._id,
            roomType: newRoom.roomType?._id || newRoom.roomType,
            guests: room.guests || { adults: 1, children: 0 },
            currentRoomDetails: {
              roomNumber: currentRoomData.roomNumber,
              name: currentRoomData.name,
              rate: oldRate
            },
            newRoomDetails: {
              roomNumber: newRoom.roomNumber,
              name: newRoom.name,
              rate: newRate,
              priceOverride: newRoom.priceOverride
            },
            priceDifference: this.priceDifference(),
            fromRate: oldRate,
            toRate: newRate,
          };
        }
        // Keep other rooms as-is
        return {
          room: room.room?._id || room.room,
          roomType: room.roomType?._id || room.roomType,
          guests: room.guests || { adults: 1, children: 0 },
        };
      });

      const nightsInfo = nightsConsumed > 0 
        ? ` (${nightsConsumed} night(s) consumed, ${nightsRemaining} night(s) remaining)` 
        : '';
      const detailedNote = `Room changed from ${currentRoomData.roomNumber} to ${newRoom.roomNumber}${nightsInfo}. Reason: ${reason}`;

      const result: RoomChangeResult = {
        mode: 'single',
        currentRoom: currentRoom,
        newRoom: newRoom,
        newRooms: newRooms,
        pricingAdjustment: {
          oldTotal: this.currentRoomCost(),
          newTotal: this.newTotal(),
          difference: this.priceDifference(),
          requiresPayment: this.priceDifference() > 0,
          refundAmount: this.priceDifference() < 0 ? Math.abs(this.priceDifference()) : undefined,
          nightsConsumed,
          nightsRemaining,
        },
        reason: reason,
        effectiveDate: this.effectiveDate().toISOString(),
        suggestedInternalNote: detailedNote,
        performedBy: this.authService.currentUserValue?._id || '',
        roomMapping: [{
          // Use the actual room document ID (currentRoomData._id), also include reservation entry ID for matching
          fromRoomId: currentRoomData._id,
          fromReservationRoomId: currentRoom._id,  // The reservation.rooms array entry ID
          fromRoomNumber: currentRoomData.roomNumber,
          fromRoomName: currentRoomData.name,
          fromRate: oldRate,
          toRoomId: newRoom._id,
          toRoomNumber: newRoom.roomNumber,
          toRoomName: newRoom.name,
          toRate: newRate,
          toRoomType: newRoom.roomType?._id || newRoom.roomType,
          priceDifference: this.priceDifference()
        }]
      };

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
