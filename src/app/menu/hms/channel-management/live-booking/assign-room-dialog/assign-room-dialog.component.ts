import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { RoomsService } from '../../../../../shared/services/rooms.service';

export interface AssignRoomDialogData {
  bookingId: string;
  rooms: any[]; // OTA rooms from booking
  roomTypes: any[]; // Room types from booking relationships
  currency: string;
  storeId: string;
}

export interface RoomAssignment {
  otaRoomIndex: number;
  roomId: string;
  guests: any[];
}

@Component({
  selector: 'app-assign-room-dialog',
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
    MatListModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './assign-room-dialog.component.html',
  styleUrl: './assign-room-dialog.component.scss',
})
export class AssignRoomDialogComponent {
  private dialogRef = inject(MatDialogRef<AssignRoomDialogComponent>);
  public data = inject<AssignRoomDialogData>(MAT_DIALOG_DATA);
  private roomsService = inject(RoomsService);
  private fb = inject(FormBuilder);

  // State
  loadingRooms = signal(false);
  availableRoomsLoading = signal(true);
  submitting = signal(false);

  // Available rooms by room type ID
  availableRoomsByType = signal<Map<string, any[]>>(new Map());

  // Form for room selections - one control per OTA room
  assignmentForm = this.fb.group({});

  constructor() {
    // Initialize form with one field per OTA room
    this.initializeForm();
    // Load available rooms on component init
    this.loadAvailableRooms();
  }

  /**
   * Initialize form with one control per OTA room
   */
  private initializeForm(): void {
    const formControls: { [key: string]: any } = {};
    this.data.rooms.forEach((_, index) => {
      formControls[`room_${index}`] = ['', Validators.required];
    });
    this.assignmentForm = this.fb.group(formControls);
  }

  /**
   * Load available rooms from the backend
   */
  private loadAvailableRooms(): void {
    this.availableRoomsLoading.set(true);

    // Get the first OTA room to determine check-in/check-out dates
    const otaRooms = this.data.rooms || [];
    if (otaRooms.length === 0) {
      this.availableRoomsLoading.set(false);
      return;
    }

    const firstRoom = otaRooms[0];
    const checkInDate = firstRoom.checkin_date || new Date().toISOString();
    const checkOutDate = firstRoom.checkout_date || new Date().toISOString();

    this.roomsService.getAvailableRooms({
      storeId: this.data.storeId,
      checkInDate,
      checkOutDate,
    }).subscribe({
      next: (rooms: any[]) => {
        // Group rooms by room type using Channex UUID (room_type_id from booking)
        // The roomType.channexRoomTypeId matches the booking's room_type_id
        const groupedRooms = new Map<string, any[]>();

        rooms.forEach((room: any) => {
          // Use channexRoomTypeId for matching with booking room_type_id (UUID)
          const roomTypeId = room.roomType?.channexRoomTypeId || room.roomType?._id || room.roomTypeId;
          if (!groupedRooms.has(roomTypeId)) {
            groupedRooms.set(roomTypeId, []);
          }
          groupedRooms.get(roomTypeId)!.push(room);
        });

        this.availableRoomsByType.set(groupedRooms);
        this.availableRoomsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load available rooms:', err);
        this.availableRoomsLoading.set(false);
      },
    });
  }

  /**
   * Get available rooms for a specific room type
   */
  getAvailableRoomsForType(roomTypeId: string): any[] {
    return this.availableRoomsByType().get(roomTypeId) || [];
  }

  /**
   * Get room type name by matching room_type_id with booking relationships data
   */
  getRoomTypeName(roomTypeId: string): string {
    const types = this.data.roomTypes || [];
    if (!types || types.length === 0) return 'Room';

    const roomType = types.find((type: any) => {
      return (type.id || type.attributes?.id) === roomTypeId;
    });

    return roomType?.attributes?.title || 'Room';
  }

  /**
   * Format guest names for display
   */
  formatGuestNames(guests: any[]): string {
    if (!guests || guests.length === 0) return 'No guest info';
    return guests.map(g => `${g.name} ${g.surname}`.trim()).join(', ');
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    return this.assignmentForm.valid;
  }

  /**
   * Submit the room assignments
   */
  submit(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.submitting.set(true);

    // Build room mapping payload
    const roomMappings: RoomAssignment[] = [];

    this.data.rooms.forEach((otaRoom: any, index: number) => {
      const selectedRoomId = this.assignmentForm.get(`room_${index}`)?.value;
      if (selectedRoomId) {
        roomMappings.push({
          otaRoomIndex: index,
          roomId: selectedRoomId,
          guests: otaRoom.guests || [],
        });
      }
    });

    // Call backend to assign rooms
    this.roomsService.assignRoomsToBooking(this.data.bookingId, roomMappings).subscribe({
      next: (result: any) => {
        this.submitting.set(false);
        this.dialogRef.close({ success: true, assignments: roomMappings, result });
      },
      error: (err) => {
        console.error('Failed to assign rooms:', err);
        this.submitting.set(false);
        // Show error message
      },
    });
  }

  /**
   * Close dialog without making changes
   */
  cancel(): void {
    this.dialogRef.close(null);
  }
}
