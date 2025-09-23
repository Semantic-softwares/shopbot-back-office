import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const noAuthGuard = () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const snackBar = inject(MatSnackBar);

  return authService.currentUser.pipe(
    map(currentUser => {
      if (currentUser) {
        snackBar.open('You are already logged in', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        router.navigate(['/menu/menu']);
        return false;
      }
      return true;
    })
  );
};
