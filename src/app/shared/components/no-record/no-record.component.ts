import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-no-record',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="flex flex-col items-center justify-center p-8">
      <mat-icon class="text-gray-400 text-5xl mb-4">{{icon}}</mat-icon>
      <h3 class="text-lg font-medium text-gray-600 mb-2">{{title}}</h3>
      <p class="text-gray-500">{{message}}</p>
    </div>
  `,
})
export class NoRecordComponent {
  @Input() icon: string = 'inbox';
  @Input() title: string = 'No Records Found';
  @Input() message: any = 'There are no records to display at this time.';
}
