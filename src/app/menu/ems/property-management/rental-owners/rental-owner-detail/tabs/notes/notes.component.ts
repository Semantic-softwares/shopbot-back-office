import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rental-owner-notes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-gray-400">
      <mat-icon class="!text-6xl !w-16 !h-16 mb-4">sticky_note_2</mat-icon>
      <h3 class="text-lg font-medium text-gray-600 mb-1">Notes</h3>
      <p class="text-sm">Rental owner notes will be available here.</p>
    </div>
  `,
})
export class RentalOwnerNotesComponent {}
