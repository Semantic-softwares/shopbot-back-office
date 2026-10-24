import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BillingStateService } from '../billing/billing-state.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const subscriptionInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const billing = inject(BillingStateService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // The platform billing locks a whole account with 403 SUBSCRIPTION_EXPIRED. That is "pay to unlock", never "sign in again".
      if (error.status === 403 && error.error?.errorCode === 'SUBSCRIPTION_EXPIRED') {
        billing.markLocked();
        if (!router.url.startsWith('/account-locked')) void router.navigate(['/account-locked']);
        return throwError(() => error);
      }

      // 402 Payment Required - subscription expired or invalid
      if (error.status === 402) {
        router.navigate(['/billing'], {
          queryParams: { reason: 'subscription-expired' }
        });
        return throwError(() => error);
      }

      // 403 Forbidden - subscription past due
      if (error.status === 403 && error.error?.code === 'SUBSCRIPTION_PAST_DUE') {
        router.navigate(['/billing'], {
          queryParams: { reason: 'past-due' }
        });
        return throwError(() => error);
      }

      return throwError(() => error);
    })
  );
};
