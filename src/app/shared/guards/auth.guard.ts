import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const snackBar = inject(MatSnackBar);

  return authService.currentUser.pipe(
    map(currentUser => {
      if (!currentUser) {
        snackBar.open('Please log in first', 'Close', {
          duration: 3000,
        });
        router.navigate(['/auth/login']);
        return false;
      }
      return true;
    })
  );
};

