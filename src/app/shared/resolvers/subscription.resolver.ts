import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';
import { Subscription } from '../models/subscription.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export const subscriptionResolver: ResolveFn<Subscription | null> = (route, state) => {
  const subscriptionService = inject(SubscriptionService);
  
  // Always fetch from server to update cache, regardless of cached state
  return subscriptionService.getSubscriptionStatus().pipe(
    catchError((error: HttpErrorResponse) => {
      // If subscription not found (404), automatically create a trial subscription
      if (error.status === 404) {
        console.log('No subscription found for store, creating trial subscription...');
        return subscriptionService.createTrial().pipe(
          catchError((trialError) => {
            console.error('Failed to create trial subscription:', trialError);
            return of(null);
          })
        );
      }
      
      // For other errors, just return null and allow the app to continue
      console.error('Failed to load subscription:', error);
      return of(null);
    })
  );
};


