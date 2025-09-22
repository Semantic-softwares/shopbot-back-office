import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { RoomsService } from '../../../../../shared/services/rooms.service';
import { 
  Room, 
  RoomType, 
  RoomStatus, 
  HousekeepingStatus,
  RoomFeatures 
} from '../../../../../shared/models/room.model';
import { MatDivider } from "@angular/material/divider";

@Component({
  selector: 'app-room-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDialogModule,
    MatDivider
],
  templateUrl: './room-details.component.html'
})
export class RoomDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private roomsService = inject(RoomsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // State signals
  loading = signal<boolean>(false);
  room = signal<Room | null>(null);
  error = signal<string | null>(null);

  // Computed properties
  roomType = computed(() => {
    const room = this.room();
    if (!room) return null;
    return typeof room.roomType === 'object' ? room.roomType : null;
  });

  roomFeatures = computed(() => {
    const room = this.room();
    if (!room?.features) return [];
    
    const features = [];
    if (room.features.hasBalcony) features.push({ name: 'Balcony', icon: 'balcony' });
    if (room.features.hasKitchen) features.push({ name: 'Kitchen', icon: 'kitchen' });
    if (room.features.hasBathtub) features.push({ name: 'Bathtub', icon: 'bathtub' });
    if (room.features.hasAirConditioning) features.push({ name: 'A/C', icon: 'ac_unit' });
    if (room.features.hasWifi) features.push({ name: 'WiFi', icon: 'wifi' });
    if (room.features.hasTV) features.push({ name: 'TV', icon: 'tv' });
    if (room.features.oceanView) features.push({ name: 'Ocean View', icon: 'waves' });
    if (room.features.cityView) features.push({ name: 'City View', icon: 'location_city' });
    
    return features;
  });

  statusConfig = computed(() => {
    const room = this.room();
    if (!room) return null;
    
    const statusConfigs = {
      available: { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800', ringColor: 'ring-green-200' },
      occupied: { color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800', ringColor: 'ring-purple-200' },
      maintenance: { color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800', ringColor: 'ring-orange-200' },
      cleaning: { color: 'cyan', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', ringColor: 'ring-cyan-200' },
      out_of_order: { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800', ringColor: 'ring-red-200' }
    };
    
    return statusConfigs[room.status] || statusConfigs.available;
  });

  housekeepingConfig = computed(() => {
    const room = this.room();
    if (!room) return null;
    
    const housekeepingConfigs = {
      clean: { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800', ringColor: 'ring-green-200' },
      dirty: { color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800', ringColor: 'ring-orange-200' },
      inspected: { color: 'cyan', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', ringColor: 'ring-cyan-200' },
      out_of_order: { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800', ringColor: 'ring-red-200' }
    };
    
    return housekeepingConfigs[room.housekeepingStatus] || housekeepingConfigs.clean;
  });

  ngOnInit(): void {
    this.loadRoomDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

   loadRoomDetails(): void {
    const roomId = this.route.snapshot.paramMap.get('id');
    if (!roomId) {
      this.router.navigate(['../'], { relativeTo: this.route });
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.roomsService.getRoom(roomId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (room) => {
          this.room.set(room);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set('Failed to load room details');
          this.loading.set(false);
          this.showError('Failed to load room details: ' + (error.error?.message || error.message));
        }
      });
  }

  onBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit(): void {
    const room = this.room();
    if (room) {
      this.router.navigate(['../', room._id, 'edit'], { relativeTo: this.route });
    }
  }

  onUpdateStatus(status: RoomStatus): void {
    const room = this.room();
    if (!room) return;

    this.roomsService.updateRoomStatus(room._id!, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedRoom) => {
          this.room.set(updatedRoom);
          this.showSuccess(`Room status updated to ${status}`);
        },
        error: (error) => {
          this.showError('Failed to update room status: ' + (error.error?.message || error.message));
        }
      });
  }

  onUpdateHousekeepingStatus(status: HousekeepingStatus): void {
    const room = this.room();
    if (!room) return;

    this.roomsService.updateHousekeepingStatus(room._id!, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedRoom) => {
          this.room.set(updatedRoom);
          this.showSuccess(`Housekeeping status updated to ${status}`);
        },
        error: (error) => {
          this.showError('Failed to update housekeeping status: ' + (error.error?.message || error.message));
        }
      });
  }

  onDeleteRoom(): void {
    const room = this.room();
    if (!room) return;

    if (confirm(`Are you sure you want to delete room ${room.roomNumber}? This action cannot be undone.`)) {
      this.roomsService.deleteRoom(room._id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccess('Room deleted successfully');
            this.router.navigate(['../'], { relativeTo: this.route });
          },
          error: (error) => {
            this.showError('Failed to delete room: ' + (error.error?.message || error.message));
          }
        });
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['bg-green-500', 'text-white']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['bg-red-500', 'text-white']
    });
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRoomTypeName(): string {
    const roomType = this.roomType();
    return roomType?.name || 'Unknown Room Type';
  }

  getRoomTypePrice(): number {
    const roomType = this.roomType();
    return roomType?.basePrice || 0;
  }

  getCapacityText(): string {
    const room = this.room();
    if (!room) return 'Unknown capacity';
    
    let text = '';
    
    // Use room-specific capacity if available
    if (room.capacity) {
      text += `${room.capacity.adults} Adults`;
      if (room.capacity.children > 0) {
        text += `, ${room.capacity.children} Children`;
      }
    }
    
    // Show max occupancy if different from standard capacity
    if (room.maxOccupancy) {
      const totalCapacity = room.capacity ? (room.capacity.adults + room.capacity.children) : 0;
      if (room.maxOccupancy !== totalCapacity) {
        text += ` (max ${room.maxOccupancy} guests)`;
      }
    }
    
    // Fallback to room type capacity if room capacity not set
    if (!text) {
      const roomType = this.roomType();
      if (roomType?.capacity) {
        text = `${roomType.capacity.adults} Adults, ${roomType.capacity.children} Children`;
      } else {
        text = 'Unknown capacity';
      }
    }
    
    return text;
  }

  getViewIcon(): string {
    const room = this.room();
    if (!room?.viewType) return 'home';
    
    const viewIcons: { [key: string]: string } = {
      ocean: 'waves',
      city: 'location_city',
      mountain: 'terrain',
      garden: 'local_florist',
      pool: 'pool',
      courtyard: 'account_balance',
      street: 'traffic',
      interior: 'home'
    };
    
    return viewIcons[room.viewType] || 'home';
  }

  getSizeDisplayText(): string {
    const room = this.room();
    if (!room?.size) return '';
    
    if (typeof room.size === 'string') {
      const sizeMap: { [key: string]: string } = {
        small: 'Small (< 200 sq ft)',
        medium: 'Medium (200-400 sq ft)',
        large: 'Large (400-600 sq ft)',
        'extra-large': 'Extra Large (> 600 sq ft)'
      };
      return sizeMap[room.size] || room.size;
    }
    
    return `${room.size} sq ft`;
  }

  hasAccessibilityFeatures(): boolean {
    const room = this.room();
    if (!room?.accessibilityFeatures) return false;
    
    return !!(
      room.accessibilityFeatures.wheelchairAccessible ||
      room.accessibilityFeatures.hearingAccessible ||
      room.accessibilityFeatures.visuallyAccessible ||
      room.accessibilityFeatures.rollInShower ||
      room.accessibilityFeatures.grabBars
    );
  }
}