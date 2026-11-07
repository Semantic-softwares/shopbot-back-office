import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { RegisterTerminalService } from '../register/register-terminal.service';

/**
 * On a shared terminal, tells the server which cashier is switched in, on the calls where it matters (the register routes and the
 * order routes). The server checks the token and the device; without one, or on any other device, nothing is added.
 */
export const registerOperatorInterceptor: HttpInterceptorFn = (req, next) => {
  const base = environment.apiUrl;
  if (!req.url.startsWith(`${base}/registers/`) && !req.url.startsWith(`${base}/orders`)) return next(req);
  const operator = inject(RegisterTerminalService).operator();
  return operator?.token ? next(req.clone({ setHeaders: { 'X-Register-Operator': operator.token } })) : next(req);
};
