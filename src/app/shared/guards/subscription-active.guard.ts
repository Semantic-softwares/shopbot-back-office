import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';

export const subscriptionActiveGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const subscriptionService = inject(SubscriptionService);

  // Get subscription from cache (updated by resolver)
  const subscription = subscriptionService.getCachedSubscription();

  // No subscription found, redirect to pricing
  if (!subscription) {
    router.navigate(['/pricing/pricing']);
    return false;
  }

  // Subscription expired or past due, redirect to billing
  if (subscription.status === 'EXPIRED' || subscription.status === 'PAST_DUE' || subscription.status === 'CANCELLED') {
    router.navigate(['/pricing/pricing']);
    return false;
  }

  // Allow trial and active subscriptions
  return subscription.status === 'TRIAL' || subscription.status === 'ACTIVE';
};
