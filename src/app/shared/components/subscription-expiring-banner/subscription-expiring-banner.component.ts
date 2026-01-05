import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SubscriptionService } from '../../services/subscription.service';

@Component({
  selector: 'app-subscription-expiring-banner',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './subscription-expiring-banner.component.html',
})
export class SubscriptionExpiringBannerComponent {
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);

  private dismissedBanner = signal(false);
  subscription = this.subscriptionService.getSubscriptionSignal();

  daysUntilRenewal = computed(() => {
    const sub = this.subscription();
    if (!sub || sub.status !== 'ACTIVE' || !sub.nextBillingDate) {
      return null;
    }

    const now = new Date();
    const nextBilling = new Date(sub.nextBillingDate);
    const daysRemaining = Math.ceil(
      (nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Show banner if expiring within 7 days and not in the past
    return daysRemaining > 0 && daysRemaining <= 7 ? daysRemaining : null;
  });

  showBanner = computed(() => {
    return !this.dismissedBanner() && this.daysUntilRenewal() !== null;
  });

  bannerClass = computed(() => {
    const days = this.daysUntilRenewal();
    if (days === null) return '';

    if (days <= 1) {
      return 'critical';
    }
    if (days <= 3) {
      return 'warning';
    }
    return 'info';
  });

  bannerIcon = computed(() => {
    const days = this.daysUntilRenewal();
    if (days === null) return '';

    if (days <= 1) {
      return 'priority_high';
    }
    if (days <= 3) {
      return 'warning';
    }
    return 'notifications_active';
  });

  bannerTitle = computed(() => {
    const days = this.daysUntilRenewal();
    if (days === null) return '';

    if (days === 0) {
      return 'Subscription Renews Today!';
    }
    if (days === 1) {
      return 'Subscription Renews Tomorrow';
    }
    if (days <= 3) {
      return 'Subscription Renewing Soon';
    }
    return 'Subscription Renewal Coming';
  });

  bannerMessage = computed(() => {
    const days = this.daysUntilRenewal();
    const sub = this.subscription();
    
    if (days === null || !sub) return '';
    
    if (days === 0) {
      return `Your subscription renews today.`;
    }
    if (days === 1) {
      return `Your subscription renews tomorrow.`;
    }
    return `Your subscription will renew in ${days} days.`;
  });

  manageBilling(): void {
    this.router.navigate(['/menu/hms/settings/hotel-settings/billing']);
  }

  closeBanner(): void {
    this.dismissedBanner.set(true);
  }
}
