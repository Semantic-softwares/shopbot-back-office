import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { SubscriptionWithModules } from '../../../../shared/models/subscription.model';

@Component({
  selector: 'app-billing-information',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTableModule, MatCardModule, MatListModule],
  templateUrl: './billing-information.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingInformationComponent {
  data = input.required<SubscriptionWithModules>();

  readonly subscription = computed(() => this.data().subscription);

  getCardDisplay(): string {
    const sub = this.subscription();
    if (sub.cardBrand && sub.cardLast4) {
      return `${sub.cardBrand.toUpperCase()} ending in ${sub.cardLast4}`;
    }
    return 'No card on file';
  }

  getCardColor(): string {
    const sub = this.subscription();
    if (!sub.cardBrand) return 'text-gray-600';
    const brand = sub.cardBrand.toLowerCase();
    if (brand.includes('visa')) return 'text-blue-600';
    if (brand.includes('mastercard')) return 'text-red-600';
    if (brand.includes('amex')) return 'text-green-600';
    return 'text-gray-600';
  }

  getStatusLabel(): string {
    const labels: Record<string, string> = {
      TRIAL: 'Free Trial',
      ACTIVE: 'Active',
      PAST_DUE: 'Payment Required',
      EXPIRED: 'Expired',
      CANCELLED: 'Cancelled',
    };
    return labels[this.subscription().status] || this.subscription().status;
  }

  getTrialDaysRemaining(): number {
    const sub = this.subscription();
    if (sub.status !== 'TRIAL') return 0;
    const trialEnd = new Date(sub.trialEndDate);
    const today = new Date();
    const daysRemaining = Math.ceil(
      (trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, daysRemaining);
  }

  getTrialProgress(): number {
    const sub = this.subscription();
    if (sub.status !== 'TRIAL') return 0;
    const trialStart = new Date(sub.trialStartDate);
    const trialEnd = new Date(sub.trialEndDate);
    const today = new Date();

    const totalDays =
      (trialEnd.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays =
      (today.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24);

    return Math.min(100, Math.round((elapsedDays / totalDays) * 100));
  }
}
