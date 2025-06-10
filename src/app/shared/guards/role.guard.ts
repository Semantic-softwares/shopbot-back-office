import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router,
  CanActivateChild
} from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.getUserRole().pipe(
      take(1),
      map(userRole => {
        console.log(userRole, 'userRole')
        if (!userRole) {
          this.snackBar.open('Please login to access this page', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }

        const requiredPermission = route.data['requiredPermission'];
        const requiredCategory = route.data['requiredCategory'];


        // If neither permission nor category is specified, deny access
        if (!requiredPermission) {
          this.snackBar.open('Access denied: Invalid route configuration', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.router.navigate(['/auth']);
          return false;
        }

        // Check permissions if specified
        if (requiredPermission && !this.authService.hasPermission(requiredPermission)) {
          this.snackBar.open('Access denied: Insufficient permissions', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.router.navigate(['/auth']);
          return false;
        }

        // Check category if specified
        if (requiredCategory && !this.authService.hasCategory(requiredCategory)) {
          this.snackBar.open('Access denied: Invalid category access', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.router.navigate(['/auth']);
          return false;
        }

        return true;
      })
    );
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.canActivate(route, state);
  }
}
