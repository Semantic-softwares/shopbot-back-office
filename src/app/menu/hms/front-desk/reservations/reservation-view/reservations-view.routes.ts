import { Routes } from '@angular/router';

export const RESERVATION_VIEW_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./reservation-view.component').then((c) => c.ReservationViewComponent),
    children: [
      {
        path: '',
        redirectTo: 'calendar',
        pathMatch: 'full',
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./reservations-list/reservations-list.component').then(
            (c) => c.ReservationsListComponent
          ),
        title: 'Reservations List- Hotel Management',
      },
        {
          path: 'calendar',
          loadComponent: () =>
            import('./reservations-calendar/reservations-calendar').then(
              (c) => c.ReservationsCalendar
            ),
          title: 'Reservation Calendar - Hotel Management',
        },
      

    ],
  },
];
