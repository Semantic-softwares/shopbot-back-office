import { Injectable, inject } from '@angular/core';
import { computed, signal, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, SubscriptionStatus } from '../models';
import { SubscriptionService } from './subscription.service';

/**
 * Feature gating utility for controlling feature access based on subscription status
 */
@Injectable({
  providedIn: 'root',
})
export class FeatureGatingService {
  private subscriptionService = inject(SubscriptionService);
  private activatedRoute = inject(ActivatedRoute);

  currentSubscription = signal<Subscription | null>(null);

  isTrialActive = computed(() => {
    const sub = this.currentSubscription();
    return sub?.status === 'TRIAL';
  });

  isSubscriptionActive = computed(() => {
    const sub = this.currentSubscription();
    return sub?.status === 'ACTIVE';
  });

  isPaymentRequired = computed(() => {
    const sub = this.currentSubscription();
    return sub?.status === 'PAST_DUE';
  });

  isAccessBlocked = computed(() => {
    const sub = this.currentSubscription();
    return sub?.status === 'EXPIRED' || sub?.status === 'CANCELLED';
  });

  hasValidSubscription = computed(() => {
    const sub = this.currentSubscription();
    return sub?.status === 'TRIAL' || sub?.status === 'ACTIVE';
  });

  trialDaysRemaining = computed(() => {
    const sub = this.currentSubscription();
    if (!sub || sub.status !== 'TRIAL') return 0;

    const trialEnd = new Date(sub.trialEndDate);
    const today = new Date();
    const daysRemaining = Math.ceil(
      (trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Math.max(0, daysRemaining);
  });

  constructor() {
    this.initializeSubscription();
  }

  private initializeSubscription(): void {
    // Try to get subscription from resolver data first
    this.activatedRoute.data.subscribe((data) => {
      if (data['subscription']) {
        this.currentSubscription.set(data['subscription']);
      } else {
        // If no data from resolver, fetch it directly
        this.loadSubscription();
      }
    });
  }

  private loadSubscription(): void {
    this.subscriptionService.getSubscriptionStatus().subscribe({
      next: (subscription) => {
        this.currentSubscription.set(subscription);
      },
      error: (error) => {
        console.error('Failed to load subscription:', error);
        this.currentSubscription.set(null);
      }
    });
  }

  /**
   * Check if a specific feature is available for the current subscription
   */
  isFeatureAvailable(feature: FeatureName): boolean {
    const sub = this.currentSubscription();
    if (!sub) return false;

    const featureMap: Record<FeatureName, SubscriptionStatus[]> = {
      // Features available in all statuses
      viewDashboard: ['TRIAL', 'ACTIVE'],
      viewReservations: ['TRIAL', 'ACTIVE'],
      viewReports: ['TRIAL', 'ACTIVE'],

      // Features only in ACTIVE
      createReservation: ['ACTIVE'],
      editReservation: ['ACTIVE'],
      managePayments: ['ACTIVE'],
      manageRooms: ['ACTIVE'],
      exportData: ['ACTIVE'],

      // Premium features
      advancedReports: ['ACTIVE'],
      automatedEmails: ['ACTIVE'],
      apiAccess: ['ACTIVE'],
    };

    const allowedStatuses = featureMap[feature] || [];
    return allowedStatuses.includes(sub.status);
  }

  /**
   * Get message for blocked feature
   */
  getBlockedFeatureMessage(feature: FeatureName): string {
    const sub = this.currentSubscription();
    if (!sub) return 'Please set up a subscription to continue.';

    if (sub.status === 'TRIAL') {
      const days = this.trialDaysRemaining();
      return `This feature is available after your trial ends. You have ${days} days remaining.`;
    }

    if (sub.status === 'PAST_DUE') {
      return 'Your subscription payment is overdue. Please update your payment method to access this feature.';
    }

    if (sub.status === 'EXPIRED') {
      return 'Your subscription has expired. Please renew to access this feature.';
    }

    if (sub.status === 'CANCELLED') {
      return 'Your subscription has been cancelled. Please contact support for more information.';
    }

    return 'This feature is not available for your subscription.';
  }

  /**
   * Track feature usage (for analytics)
   */
  trackFeatureUsage(feature: FeatureName, data?: Record<string, any>): void {
    const sub = this.currentSubscription();
    if (!sub) return;

    // TODO: Send to analytics service
    console.log(`Feature used: ${feature}`, {
      subscriptionStatus: sub.status,
      ...data,
    });
  }

  /**
   * Manually refresh subscription status
   */
  refreshSubscription(): void {
    this.subscriptionService.refreshSubscription().subscribe({
      next: (sub) => this.currentSubscription.set(sub),
    });
  }

  /**
   * Get current subscription
   */
  getSubscription(): Subscription | null {
    return this.currentSubscription();
  }
}

export type FeatureName =
  // Dashboard & Navigation
  | 'viewDashboard'
  | 'viewReservations'
  | 'viewReports'

  // Reservation Management
  | 'createReservation'
  | 'editReservation'

  // Financial Management
  | 'managePayments'

  // Property Management
  | 'manageRooms'

  // Export & Integration
  | 'exportData'
  | 'apiAccess'

  // Analytics
  | 'advancedReports'
  | 'automatedEmails';
