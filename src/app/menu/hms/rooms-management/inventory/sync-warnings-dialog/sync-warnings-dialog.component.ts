import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface SyncWarningsDialogData {
  availabilityCount: number;
  restrictionsCount: number;
  warnings: any[];
  // Full sync certification fields (temporary)
  fullSyncResult?: boolean;
  availabilityTaskId?: string | null;
  restrictionsTaskId?: string | null;
  availabilityResponse?: any;
  restrictionsResponse?: any;
}

export interface GroupedWarning {
  type: string;
  icon: string;
  label: string;
  message: string;
  count: number;
  dates: string[];
  ratePlanIds: string[];
  sampleRate?: number;
  maxPrice?: string;
}

@Component({
  selector: 'app-sync-warnings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule,
    MatBadgeModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sync-warnings-dialog.component.html',
  styleUrl: './sync-warnings-dialog.component.scss',
})
export class SyncWarningsDialogComponent {
  data: SyncWarningsDialogData = inject(MAT_DIALOG_DATA);
  private snackBar = inject(MatSnackBar);

  groupedWarnings = signal<GroupedWarning[]>(this.buildGroups());

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Copied to clipboard!', 'Close', { duration: 2000 });
    });
  }

  private buildGroups(): GroupedWarning[] {
    const groups = new Map<string, GroupedWarning>();

    for (const w of this.data.warnings) {
      // Handle internal error objects (availability_error, restrictions_error)
      if (w?.type === 'availability_error' || w?.type === 'restrictions_error') {
        const key = w.type;
        if (!groups.has(key)) {
          groups.set(key, {
            type: key,
            icon: w.type === 'availability_error' ? 'cloud_off' : 'error',
            label: w.type === 'availability_error' ? 'Availability Error' : 'Restrictions Error',
            message: w.message || 'Unknown error',
            count: 1,
            dates: [],
            ratePlanIds: [],
          });
        } else {
          groups.get(key)!.count++;
        }
        continue;
      }

      // Handle Channex warning objects: { warning: { field: [msg] }, date, rate_plan_id, rate, ... }
      if (w?.warning && typeof w.warning === 'object') {
        for (const [field, messages] of Object.entries(w.warning)) {
          const msgArr = Array.isArray(messages) ? messages : [messages];
          const msgText = msgArr.join('; ');
          const key = `${field}::${msgText}`;

          if (!groups.has(key)) {
            groups.set(key, {
              type: field,
              icon: this.getIconForField(field),
              label: this.getLabelForField(field),
              message: msgText,
              count: 1,
              dates: w.date ? [w.date] : [],
              ratePlanIds: w.rate_plan_id ? [w.rate_plan_id] : [],
              sampleRate: w.rate,
            });
          } else {
            const g = groups.get(key)!;
            g.count++;
            if (w.date && !g.dates.includes(w.date)) g.dates.push(w.date);
            if (w.rate_plan_id && !g.ratePlanIds.includes(w.rate_plan_id)) g.ratePlanIds.push(w.rate_plan_id);
          }
        }
        continue;
      }

      // Fallback for plain strings or unknown shapes
      const fallbackKey = typeof w === 'string' ? w : JSON.stringify(w);
      if (!groups.has(fallbackKey)) {
        groups.set(fallbackKey, {
          type: 'unknown',
          icon: 'warning',
          label: 'Warning',
          message: typeof w === 'string' ? w : JSON.stringify(w),
          count: 1,
          dates: [],
          ratePlanIds: [],
        });
      } else {
        groups.get(fallbackKey)!.count++;
      }
    }

    // Sort: errors first, then by count desc
    return Array.from(groups.values()).sort((a, b) => {
      if (a.type.includes('error') && !b.type.includes('error')) return -1;
      if (!a.type.includes('error') && b.type.includes('error')) return 1;
      return b.count - a.count;
    });
  }

  getDateRange(dates: string[]): string {
    if (dates.length === 0) return '';
    const sorted = [...dates].sort();
    if (sorted.length === 1) return sorted[0];
    return `${sorted[0]} → ${sorted[sorted.length - 1]}`;
  }

  private getIconForField(field: string): string {
    switch (field) {
      case 'max_price': return 'attach_money';
      case 'min_price': return 'money_off';
      case 'min_stay': return 'hotel';
      case 'min_stay_arrival': return 'hotel';
      case 'min_stay_through': return 'hotel';
      case 'max_stay': return 'event_busy';
      case 'rate': return 'price_change';
      case 'availability': return 'inventory';
      default: return 'warning';
    }
  }

  private getLabelForField(field: string): string {
    switch (field) {
      case 'max_price': return 'Rate Too High';
      case 'min_price': return 'Rate Too Low';
      case 'min_stay': return 'Min Stay Not Supported';
      case 'min_stay_arrival': return 'Min Stay Arrival Issue';
      case 'min_stay_through': return 'Min Stay Through Issue';
      case 'max_stay': return 'Max Stay Issue';
      case 'rate': return 'Rate Issue';
      case 'availability': return 'Availability Issue';
      default: return field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  }
}
