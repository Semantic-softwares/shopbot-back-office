import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { Guest } from '../../models/reservation.model';
import { Room } from '../../models/room.model';
import { GuestSearchComponent } from '../guest-search/guest-search.component';
import { GuestService } from '../../services/guest.service';
import { RoomsService } from '../../services/rooms.service';
import { StoreStore } from '../../stores/store.store';

export interface GuestSelectionDialogData {
  selectedGuest: Guest | null;
}

export interface GuestSelectionDialogResult {
  guest: Guest | null;
  action: 'select' | 'remove' | 'cancel';
}

export interface OccupiedRoom extends Omit<Room, 'currentGuest' | 'currentReservation'> {
  currentGuest?: Guest | string;
  currentReservation?: any;
}

@Component({
  selector: 'app-guest-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatTabsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatTooltipModule,
    FormsModule,
    GuestSearchComponent,
  ],
  templateUrl: './guest-selection-dialog.component.html',
  styleUrl: './guest-selection-dialog.component.scss'
})
export class GuestSelectionDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<GuestSelectionDialogComponent>);
  private dialogData: GuestSelectionDialogData = inject(MAT_DIALOG_DATA);
  public guestService = inject(GuestService);
  private roomsService = inject(RoomsService);
  private storeStore = inject(StoreStore);

  selectedGuest = signal<Guest | null>(this.dialogData?.selectedGuest || null);
  selectionMode = signal<'search' | 'room'>('search');
  
  // Room selection state
  occupiedRooms = signal<OccupiedRoom[]>([]);
  loadingRooms = signal(false);
  selectedRoom = signal<OccupiedRoom | null>(null);
  roomGuests = signal<Guest[]>([]);

  // Computed: guests assigned to the selected room
  availableRoomGuests = computed(() => {
    const room = this.selectedRoom();
    if (!room) return [];
    
    const guests: Guest[] = [];
    
    // Find the specific room entry in reservation.rooms that matches the selected room
    if (room.currentReservation && typeof room.currentReservation === 'object') {
      const reservation = room.currentReservation;
      
      if (reservation.rooms && Array.isArray(reservation.rooms)) {
        // Find matching room entry by comparing room IDs
        const matchingReservationRoom = reservation.rooms.find((resRoom: any) => {
          const roomId = typeof resRoom.room === 'object' ? resRoom.room._id : resRoom.room;
          return roomId === room._id;
        });
        
        // Add the assigned guest for this specific room
        if (matchingReservationRoom?.assignedGuest && typeof matchingReservationRoom.assignedGuest === 'object') {
          guests.push(matchingReservationRoom.assignedGuest as Guest);
        }
      }
    }
    
    // Fallback: Add currentGuest if no reservation data found
    if (guests.length === 0 && room.currentGuest && typeof room.currentGuest === 'object') {
      guests.push(room.currentGuest as Guest);
    }
    
    return guests;
  });

  ngOnInit(): void {
    this.loadOccupiedRooms();
  }

  loadOccupiedRooms(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;

    this.loadingRooms.set(true);
    this.roomsService.getRooms(storeId, { status: ['occupied'] }).subscribe({
      next: (rooms) => {
        this.occupiedRooms.set(rooms as OccupiedRoom[]);
        this.loadingRooms.set(false);
      },
      error: () => {
        this.loadingRooms.set(false);
      }
    });
  }

  onRoomSelected(room: OccupiedRoom): void {
    this.selectedRoom.set(room);
    // Clear selected guest when room changes
    if (this.selectionMode() === 'room') {
      this.selectedGuest.set(null);
    }
  }

  onRoomGuestSelected(guest: Guest): void {
    this.selectedGuest.set(guest);
  }

  onGuestSelected(guest: Guest): void {
    this.selectedGuest.set(guest);
  }

  removeGuest(): void {
    this.selectedGuest.set(null);
    this.dialogRef.close({ guest: null, action: 'remove' } as GuestSelectionDialogResult);
  }

  confirmSelection(): void {
    this.dialogRef.close({ guest: this.selectedGuest(), action: 'select' } as GuestSelectionDialogResult);
  }

  onTabChange(index: number): void {
    this.selectionMode.set(index === 0 ? 'search' : 'room');
    // Clear guest selection when switching tabs
    this.selectedGuest.set(null);
    this.selectedRoom.set(null);
  }

  // Helper to get guest name from room's currentGuest (which could be string or Guest)
  getRoomGuestName(room: OccupiedRoom): string {
    if (!room.currentGuest) return '';
    if (typeof room.currentGuest === 'string') return room.currentGuest;
    return this.guestService.getGuestName(room.currentGuest);
  }
}
