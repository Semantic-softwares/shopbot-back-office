import { Component, Input, computed, inject, input, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { StoreStore } from '../../../../../shared/stores/store.store';
import { Reservation } from '../../../../../shared/models/reservation.model';



@Component({
  selector: 'app-room-change-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatExpansionModule,
    MatTableModule,
  ],
  templateUrl: './room-change-history.component.html',
})
export class RoomChangeHistoryComponent {
  public  storeStore = inject(StoreStore); 
  public reservation = input<Reservation>();
//   private _roomChanges = signal<RoomChangeEntry[]>(this.reservation()?.roomChanges || []);
  public roomChanges = computed(() => {
    // Sort by performedAt descending (most recent first)
    return [...this.reservation()?.roomChanges! || []].sort((a, b) => {
      const dateA = new Date(a.performedAt).getTime();
      const dateB = new Date(b.performedAt).getTime();
      return dateB - dateA;
    });
  });

  getChangeTypeIcon(changeType: string): string {
    const icons: Record<string, string> = {
      'upgrade': 'arrow_upward',
      'downgrade': 'arrow_downward',
      'lateral': 'swap_horiz',
      'maintenance': 'build',
      'guest_request': 'person',
    };
    return icons[changeType] || 'swap_horiz';
  }

  formatChangeType(changeType: string): string {
    const labels: Record<string, string> = {
      'upgrade': 'Upgrade',
      'downgrade': 'Downgrade',
      'lateral': 'Lateral Move',
      'maintenance': 'Maintenance',
      'guest_request': 'Guest Request',
    };
    return labels[changeType] || changeType;
  }

  formatAdjustmentType(adjustmentType: string): string {
    const labels: Record<string, string> = {
      'charged': 'Charged',
      'refunded': 'Refunded',
      'credited': 'Credited',
      'waived': 'Waived',
      'kept_original_rate': 'Original Rate Kept',
    };
    return labels[adjustmentType] || adjustmentType;
  }

  getRoomName(roomData: any): string {
    console.log('roomData:', roomData);
    if (roomData.room?.name) {
      return roomData.room.name;
    }
    if (roomData.roomType?.name) {
      return roomData.roomType.name;
    }
    return '';
  }

  getPerformerName(performer: any): string {
    if (!performer) return 'Unknown';
    if (typeof performer === 'string') return 'Staff';
    if (performer.firstName || performer.lastName) {
      return `${performer.firstName || ''} ${performer.lastName || ''}`.trim();
    }
    return 'Staff';
  }
}
