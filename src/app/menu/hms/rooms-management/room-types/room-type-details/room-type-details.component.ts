import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';

import { RoomsService } from '../../../../../shared/services/rooms.service';
import { RoomType } from '../../../../../shared/models/room.model';

@Component({
  selector: 'app-room-type-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './room-type-details.component.html'
})
export class RoomTypeDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private roomsService = inject(RoomsService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // Signals
  roomType = signal<RoomType | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  roomTypeId = signal<string | null>(null);

  // Computed values
  totalCapacity = computed(() => {
    const rt = this.roomType();
    if (rt?.capacity) {
      return (rt.capacity.adults || 0) + (rt.capacity.children || 0);
    }
    return 0;
  });

  roomFeatures = computed(() => {
    const rt = this.roomType();
    if (!rt?.features) return [];
    
    const features = [];
    const featureMap = {
      hasPrivateBathroom: 'Private Bathroom',
      hasAirConditioning: 'Air Conditioning',
      hasWifi: 'WiFi',
      hasTv: 'Television',
      hasRefrigerator: 'Refrigerator',
      hasBalcony: 'Balcony',
      hasKitchenette: 'Kitchenette',
      hasWorkDesk: 'Work Desk',
      hasSafe: 'Safe',
      hasHairdryer: 'Hair Dryer',
      hasIroning: 'Iron & Board',
      hasSeatingArea: 'Seating Area'
    };

    for (const [key, label] of Object.entries(featureMap)) {
      if (rt.features[key as keyof typeof rt.features]) {
        features.push(label);
      }
    }
    
    return features;
  });

  ngOnInit() {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = params['id'];
      if (id) {
        this.roomTypeId.set(id);
        this.loadRoomType(id);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRoomType(id: string) {
    this.loading.set(true);
    this.error.set(null);

    this.roomsService.getRoomType(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (roomType) => {
        this.roomType.set(roomType);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading room type:', error);
        this.error.set('Failed to load room type details');
        this.loading.set(false);
      }
    });
  }

  onEdit() {
    const id = this.roomTypeId();
    if (id) {
      this.router.navigate(['/menu/hms/rooms-management/room-types/', id, 'edit']);
    }
  }

  onDelete() {
    const roomType = this.roomType();
    if (!roomType) return;

    const id = roomType._id || roomType.id;
    if (!id) return;

    if (confirm(`Are you sure you want to delete "${roomType.name}"? This action cannot be undone.`)) {
      this.roomsService.deleteRoomType(id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.snackBar.open('Room type deleted successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/menu/hms/rooms-management/room-types/room-types']);
        },
        error: (error) => {
          console.error('Error deleting room type:', error);
          this.snackBar.open('Failed to delete room type', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onToggleActive() {
    const roomType = this.roomType();
    if (!roomType) return;

    const id = roomType._id || roomType.id;
    if (!id) return;

    const newActiveStatus = !roomType.active;
    const action = newActiveStatus ? 'activate' : 'deactivate';

    this.roomsService.updateRoomType(id, { active: newActiveStatus }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedRoomType) => {
        this.roomType.set(updatedRoomType);
        this.snackBar.open(`Room type ${action}d successfully`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error(`Error ${action}ing room type:`, error);
        this.snackBar.open(`Failed to ${action} room type`, 'Close', { duration: 3000 });
      }
    });
  }

  goBack() {
    this.router.navigate(['/menu/hms/rooms-management/room-types/room-types']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  getCapacityText(): string {
    const rt = this.roomType();
    if (!rt?.capacity) return 'Not specified';
    
    const parts = [];
    if (rt.capacity.adults) parts.push(`${rt.capacity.adults} Adult${rt.capacity.adults > 1 ? 's' : ''}`);
    if (rt.capacity.children) parts.push(`${rt.capacity.children} Child${rt.capacity.children > 1 ? 'ren' : ''}`);
    
    return parts.join(', ') || 'Not specified';
  }
}