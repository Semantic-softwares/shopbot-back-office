import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-no-record',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-8">
      <!-- Icon Container with Subtle Background -->
      <div class="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <mat-icon class="!text-gray-400 !text-4xl">{{icon}}</mat-icon>
      </div>
      
      <!-- Title -->
      <h3 class="text-xl font-semibold text-gray-800 mb-3 text-center">{{title}}</h3>
      
      <!-- Message -->
      <p class="text-gray-500 text-center max-w-md leading-relaxed mb-6">{{message}}</p>
      
      <!-- Optional Action Button Slot -->
      <ng-content></ng-content>
      
      <!-- Decorative Elements -->
      <div class="mt-8 flex space-x-2 opacity-30">
        <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  `,
})
export class NoRecordComponent {
  @Input() icon: string = 'inbox';
  @Input() title: string = 'No Records Found';
  @Input() message: any = 'There are no records to display at this time.';
}
