import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const subscriptionActiveGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const subscriptionService = inject(SubscriptionService);

  // Try cache first for instant navigation
  const cached = subscriptionService.getCachedSubscription();

  if (cached) {
    return evaluateSubscription(cached, router);
  }

  // No cache (first login) — fetch from server before deciding
  return subscriptionService.getSubscriptionStatus().pipe(
    map((subscription) => {
      return evaluateSubscription(subscription, router);
    }),
    catchError((error) => {
      // 404 means no subscription exists yet — let the resolver create a trial.
      // Redirect to pricing so the resolver on that route can handle trial creation.
      if (error?.status === 404) {
        // Attempt to create trial inline so user lands on menu, not pricing
        return subscriptionService.createTrial().pipe(
          map((trialSub) => evaluateSubscription(trialSub, router)),
          catchError(() => {
            // If trial creation also fails, send to pricing as last resort
            router.navigate(['/pricing/pricing']);
            return of(false);
          }),
        );
      }
      // For other server errors, allow through to avoid blocking the user
      console.error('Subscription check failed, allowing access:', error);
      return of(true);
    }),
  );
};

function evaluateSubscription(subscription: any, router: Router): boolean {
  if (!subscription) {
    router.navigate(['/pricing/pricing']);
    return false;
  }

  if (subscription.status === 'EXPIRED' || subscription.status === 'PAST_DUE' || subscription.status === 'CANCELLED') {
    router.navigate(['/pricing/pricing']);
    return false;
  }

  // Allow trial and active subscriptions
  return subscription.status === 'TRIAL' || subscription.status === 'ACTIVE';
}
