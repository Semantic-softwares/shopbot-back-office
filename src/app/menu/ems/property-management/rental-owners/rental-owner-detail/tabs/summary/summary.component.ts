import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RentalOwnerDetailComponent } from '../../rental-owner-detail.component';

@Component({
  selector: 'app-rental-owner-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './summary.component.html',
})
export class RentalOwnerSummaryComponent {
  private parent = inject(RentalOwnerDetailComponent);

  readonly owner = this.parent.owner;

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-600! text-white!',
      INACTIVE: 'bg-gray-500! text-white!',
    };
    return map[status] || 'bg-gray-500! text-white!';
  }
}
