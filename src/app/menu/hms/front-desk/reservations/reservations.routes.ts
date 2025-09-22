import { Routes } from '@angular/router';
import { reservationEditGuard } from '../../../../shared/guards/reservation-edit.guard';

export const reservationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./reservations.component').then((c) => c.ReservationsComponent),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./reservations-list/reservations-list.component').then(
            (c) => c.ReservationsListComponent
          ),
        title: 'Reservations - Hotel Management',
      },
      //   {
      //     path: 'calendar',
      //     loadComponent: () =>
      //       import('./calendar/reservations-calendar.component').then(
      //         (c) => c.ReservationsCalendarComponent
      //       ),
      //     title: 'Reservation Calendar - Hotel Management',
      //   },
      {
        path: 'create',
        loadComponent: () =>
          import('./reservation-form/reservation-form.component').then(
            (c) => c.ReservationFormComponent
          ),
        title: 'New Reservation - Hotel Management',
      },
      {
        path: 'edit/:id',
        loadComponent: () =>
          import('./reservation-form/reservation-form.component').then(
            (c) => c.ReservationFormComponent
          ),
        title: 'Edit Reservation - Hotel Management',
        canActivate: [reservationEditGuard],
      },
      {
        path: 'details/:id',
        loadComponent: () =>
          import('./reservation-details/reservation-details.component').then(
            (c) => c.ReservationDetailsComponent
          ),
        title: 'Reservation Details - Hotel Management',
      },

    ],
  },
];
