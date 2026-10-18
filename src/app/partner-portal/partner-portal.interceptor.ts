import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PartnerPortalAuthService } from './partner-portal-auth.service';

const PORTAL = `${environment.apiUrl}/partner-portal`;
const OPEN = ['/auth/login', '/invite/'];

/**
 * Puts the partner's token on partner-portal calls, and only those. A call that comes back unauthorised ends the partner session
 * (except sign-in itself, where a 401 just means wrong details).
 */
export const partnerPortalInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(PORTAL)) return next(req);
  const auth = inject(PartnerPortalAuthService);
  const token = auth.token();
  const authed = token ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) }) : req;
  return next(authed).pipe(
    catchError((e: HttpErrorResponse) => {
      if (e.status === 401 && token && !OPEN.some((p) => req.url.includes(p))) auth.logout();
      return throwError(() => e);
    }),
  );
};
