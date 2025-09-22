import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ReservationService } from '../services/reservation.service';

export const reservationEditGuard = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const reservationService = inject(ReservationService);
  const snackBar = inject(MatSnackBar);

  const reservationId = route.paramMap.get('id');
  
  if (!reservationId) {
    snackBar.open('Invalid reservation ID', 'Close', {
      duration: 3000,
    });
    router.navigate(['/dashboard/reservations']);
    return false;
  }

  return reservationService.getReservationById(reservationId).pipe(
    map(reservation => {
      if (!reservation) {
        snackBar.open('Reservation not found', 'Close', {
          duration: 3000,
        });
        router.navigate(['/dashboard/reservations']);
        return false;
      }

      // Check if reservation is checked in
      if (reservation.status === 'checked_in' || reservation.actualCheckInDate) {
        snackBar.open('Cannot edit reservation that has been checked in', 'Close', {
          duration: 4000,
        });
        router.navigate(['/dashboard/reservations', reservationId]);
        return false;
      }

      return true;
    }),
    catchError(error => {
      console.error('Error checking reservation status:', error);
      snackBar.open('Error checking reservation status', 'Close', {
        duration: 3000,
      });
      router.navigate(['/dashboard/reservations']);
      return of(false);
    })
  );
};