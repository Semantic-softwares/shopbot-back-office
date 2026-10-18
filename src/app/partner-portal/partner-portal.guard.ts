import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PartnerPortalAuthService } from './partner-portal-auth.service';

export const partnerPortalGuard: CanActivateFn = () => {
  const auth = inject(PartnerPortalAuthService);
  return auth.signedIn() ? true : inject(Router).createUrlTree(['/partner/login']);
};
