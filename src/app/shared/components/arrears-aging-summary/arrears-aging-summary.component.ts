import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ArrearsAgingSummary } from '../../models/arrears.model';
import { StoreStore } from '../../stores/store.store';

interface AgingBucketDisplay {
  label: string;
  amount: number;
  percentage: number;
  color: string;
  severity: string;
}

@Component({
  selector: 'app-arrears-aging-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, CurrencyPipe],
  templateUrl: './arrears-aging-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArrearsAgingSummaryComponent {
  @Input() agingSummary: ArrearsAgingSummary | null = null;

  private readonly storeStore = inject(StoreStore);

  protected readonly currencyCode = computed(() => this.storeStore.selectedStore()?.currencyCode || 'NGN');

  get agingBuckets(): AgingBucketDisplay[] {
    if (!this.agingSummary) return [];

    const total = this.agingSummary.total || 1;

    return [
      {
        label: '0–30 Days',
        amount: this.agingSummary.bucket0to30,
        percentage: Math.round((this.agingSummary.bucket0to30 / total) * 100),
        color: 'accent', // Blue
        severity: 'low',
      },
      {
        label: '31–60 Days',
        amount: this.agingSummary.bucket31to60,
        percentage: Math.round((this.agingSummary.bucket31to60 / total) * 100),
        color: 'warn', // Orange
        severity: 'medium',
      },
      {
        label: '61–90 Days',
        amount: this.agingSummary.bucket61to90,
        percentage: Math.round((this.agingSummary.bucket61to90 / total) * 100),
        color: 'warn', // Orange
        severity: 'high',
      },
      {
        label: '90+ Days',
        amount: this.agingSummary.bucket90Plus,
        percentage: Math.round((this.agingSummary.bucket90Plus / total) * 100),
        color: 'error', // Red
        severity: 'critical',
      },
    ];
  }
}
