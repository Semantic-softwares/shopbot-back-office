import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { CurrencyPipe } from '@angular/common';

interface AvailableRoom {
  id: string;
  roomType: string;
  roomNumber?: string;
  pricePerNight?: number;
  maxCapacity?: number;
  amenities?: string[];
}

interface SelectedRoomDisplay {
  roomId: string;
  roomType: string;
  roomNumber?: string;
  nights: number;
  totalPrice: number;
  adults: number;
  children: number;
}

@Component({
  selector: 'app-room-selection-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatCheckboxModule,
    MatListModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    CurrencyPipe,
  ],
  template: `
    <div class="space-y-6">
      <!-- Available Rooms -->
      <mat-card class="shadow-sm">
        <mat-card-header>
          <mat-card-title>Select Rooms</mat-card-title>
          <mat-card-subtitle>Choose from available rooms for your stay</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (availableRooms && availableRooms.length > 0) {
            <div class="space-y-3">
              @for (room of availableRooms; track room.id; let i = $index) {
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <h3 class="font-semibold text-lg">{{ room.roomType }}</h3>
                        @if (room.roomNumber) {
                          <span class="text-xs bg-gray-100 px-2 py-1 rounded">
                            Room #{{ room.roomNumber }}
                          </span>
                        }
                        @if (room.maxCapacity) {
                          <span class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            Capacity: {{ room.maxCapacity }}
                          </span>
                        }
                      </div>
                      <p class="text-sm text-gray-600 mb-3">
                        @if (room.pricePerNight) {
                          {{ room.pricePerNight | currency }}
                          <span class="text-xs">per night</span>
                        }
                      </p>
                      @if (room.amenities && room.amenities.length > 0) {
                        <div class="flex flex-wrap gap-1 mb-3">
                          @for (amenity of room.amenities; track amenity) {
                            <mat-chip>{{ amenity }}</mat-chip>
                          }
                        </div>
                      }
                    </div>
                    <button
                      mat-raised-button
                      [color]="isRoomSelected(room.id) ? 'primary' : ''"
                      (click)="toggleRoom(room.id, i)"
                      class="whitespace-nowrap"
                    >
                      @if (isRoomSelected(room.id)) {
                        <mat-icon>check_circle</mat-icon>
                        Remove
                      } @else {
                        <mat-icon>add_circle</mat-icon>
                        Add
                      }
                    </button>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-gray-500 text-center py-8">No rooms available for selected dates</p>
          }
        </mat-card-content>
      </mat-card>

      <!-- Selected Rooms Display -->
      @if (selectedRooms() && selectedRooms().length > 0) {
        <mat-card class="shadow-sm border-l-4 border-l-green-500">
          <mat-card-header>
            <mat-card-title>
              Selected Rooms
              <mat-badge matBadge="{{selectedRooms().length}}"></mat-badge>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="space-y-3">
              @for (room of selectedRooms(); track room.roomId) {
                <div class="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p class="text-xs text-gray-600">Room</p>
                      <p class="font-semibold">{{ room.roomType }}</p>
                      @if (room.roomNumber) {
                        <p class="text-xs text-gray-500">#{{ room.roomNumber }}</p>
                      }
                    </div>
                    <div>
                      <p class="text-xs text-gray-600">Nights</p>
                      <p class="font-semibold">{{ room.nights }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-600">Guests</p>
                      <p class="text-sm">
                        <span class="font-semibold">{{ room.adults }}</span>
                        <span class="text-xs text-gray-500">A</span>
                        +
                        <span class="font-semibold">{{ room.children }}</span>
                        <span class="text-xs text-gray-500">C</span>
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-600">Total</p>
                      <p class="font-semibold text-green-600">{{ room.totalPrice | currency }}</p>
                    </div>
                  </div>
                  <button
                    mat-stroked-button
                    color="warn"
                    (click)="removeRoom(room.roomId)"
                    size="small"
                    class="w-full"
                  >
                    <mat-icon>delete</mat-icon>
                    Remove Room
                  </button>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
})
export class RoomSelectionStepComponent {
  @Input() reservationForm!: FormGroup;
  @Input() availableRooms: AvailableRoom[] = [];
  @Input() numberOfNights!: () => number;

  @Output() roomToggled = new EventEmitter<{ roomId: string; index: number; add: boolean }>();
  @Output() roomRemoved = new EventEmitter<string>();

  selectedRooms = computed(() => {
    const roomsArray = this.reservationForm?.get('rooms') as FormArray;
    if (!roomsArray) return [];

    return roomsArray.controls.map((control, index) => {
      const formValue = control.value;
      const nights = this.numberOfNights?.() || 0;
      
      return {
        roomId: formValue.roomId,
        roomType: formValue.roomType || 'Unknown Room',
        roomNumber: formValue.roomNumber,
        nights,
        totalPrice: formValue.totalPrice || 0,
        adults: formValue.adults || 0,
        children: formValue.children || 0,
      } as SelectedRoomDisplay;
    });
  });

  isRoomSelected(roomId: string): boolean {
    const roomsArray = this.reservationForm?.get('rooms') as FormArray;
    if (!roomsArray) return false;
    return roomsArray.controls.some((control) => control.get('roomId')?.value === roomId);
  }

  toggleRoom(roomId: string, index: number): void {
    const isSelected = this.isRoomSelected(roomId);
    this.roomToggled.emit({ roomId, index, add: !isSelected });
  }

  removeRoom(roomId: string): void {
    this.roomRemoved.emit(roomId);
  }
}
