import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { PlatformBillingService } from '../services/platform-billing.service';

/**
 * The super-admin area is for platform admins only. This only decides whether to SHOW the area: every call it makes is checked again
 * by the server, which reads the admin list from the database each time. Anyone else is sent back to the app.
 */
export const platformAdminGuard = () => {
  const router = inject(Router);
  return inject(PlatformBillingService)
    .isPlatformAdmin()
    .pipe(
      map((isAdmin) => (isAdmin ? true : router.createUrlTree(['/menu']))),
      catchError(() => of(router.createUrlTree(['/menu']))),
    );
};
