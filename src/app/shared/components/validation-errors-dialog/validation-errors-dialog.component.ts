import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

export interface ValidationErrorsDialogData {
  invalidControls: string[];
  title?: string;
  message?: string;
}

@Component({
  selector: 'app-validation-errors-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ],
  templateUrl: './validation-errors-dialog.component.html',
  styleUrl: './validation-errors-dialog.component.scss'
})
export class ValidationErrorsDialogComponent {
  data: ValidationErrorsDialogData = inject(MAT_DIALOG_DATA);

  constructor() {}

  /**
   * Convert a control path to a human-readable field name
   * e.g., "pricing.fees.serviceFee" -> "Service Fee"
   * "sharers.0.guest" -> "Guest (Primary)"
   */
  formatFieldName(path: string): string {
    const parts = path.split('.');
    const lastPart = parts[parts.length - 1];
    
    // Handle array indices - check if previous part is a number
    if (parts.length > 1 && !isNaN(Number(parts[parts.length - 2]))) {
      const index = parseInt(parts[parts.length - 2]);
      const fieldName = this.camelCaseToTitleCase(lastPart);
      
      // Add context for what the array represents
      const arrayName = parts[0];
      const arrayContext = this.getArrayContext(arrayName, index);
      
      return `${fieldName} ${arrayContext}`.trim();
    }
    
    return this.camelCaseToTitleCase(lastPart || path);
  }

  /**
   * Get human-readable context for array items
   */
  private getArrayContext(arrayName: string, index: number): string {
    const contextMap: { [key: string]: (i: number) => string } = {
      'sharers': (i) => i === 0 ? '(Primary Guest)' : `(Guest #${i + 1})`,
      'rooms': (i) => `(Room #${i + 1})`,
      'fees': (i) => `(Fee Item #${i + 1})`,
    };
    
    const contextFn = contextMap[arrayName];
    return contextFn ? contextFn(index) : '';
  }

  /**
   * Convert camelCase to Title Case
   * e.g., "serviceFee" -> "Service Fee"
   */
  private camelCaseToTitleCase(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
  }

  /**
   * Get the full path for display with enhanced descriptions
   * e.g., "sharers.0.guest" -> "Room Sharers > Primary Guest > Guest"
   */
  formatFullPath(path: string): string {
    const parts = path.split('.');
    const result: string[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // Skip numeric indices but use them for context
      if (!isNaN(Number(part))) {
        continue;
      }
      
      // Get human-readable name for the section
      const sectionName = this.getSectionName(part, i === 0);
      if (sectionName) {
        result.push(sectionName);
      }
    }
    
    // Add array item context if present
    for (let i = 0; i < parts.length - 1; i++) {
      if (!isNaN(Number(parts[i + 1]))) {
        const arrayName = parts[i];
        const index = parseInt(parts[i + 1]);
        const context = this.getArrayContext(arrayName, index);
        if (context) {
          // Insert context after the array name
          const lastIndex = result.findIndex(r => r.toLowerCase().includes(arrayName));
          if (lastIndex >= 0) {
            result.splice(lastIndex + 1, 0, context);
          }
        }
      }
    }
    
    return result.length > 0 ? result.join(' > ') : path;
  }

  /**
   * Get human-readable section names
   */
  private getSectionName(key: string, isRoot: boolean): string {
    const sectionMap: { [key: string]: string } = {
      'guest': 'Guest',
      'checkInDate': 'Check-in Date',
      'checkOutDate': 'Check-out Date',
      'numberOfAdults': 'Number of Adults',
      'numberOfChildren': 'Number of Children',
      'pricing': 'Pricing',
      'subtotal': 'Subtotal',
      'taxes': 'Taxes',
      'fees': 'Fees',
      'serviceFee': 'Service Fee',
      'cleaningFee': 'Cleaning Fee',
      'resortFee': 'Resort Fee',
      'total': 'Total',
      'paid': 'Paid Amount',
      'balance': 'Balance',
      'sharers': 'Room Sharers',
      'rooms': 'Rooms',
      'room': 'Room',
      'assignedGuest': 'Assigned Guest',
      'stayPeriod': 'Stay Period',
      'guests': 'Guests',
      'pricePerNight': 'Price Per Night',
      'totalPrice': 'Total Price',
    };
    
    return sectionMap[key] || this.camelCaseToTitleCase(key);
  }
}
