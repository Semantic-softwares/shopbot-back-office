import { Routes } from '@angular/router';

export const DASHBOARD_FRONT_DESK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./front-desk.component').then((m) => m.FrontDeskComponent),
    children: [
      {
        path: '',
        redirectTo: 'reservations',
        pathMatch: 'full',
      },
      {
        path: 'reservations',
        loadChildren: () =>
          import('./reservations/reservations.routes').then(
            (m) => m.reservationRoutes
          ),
      },
      {
        path: 'check-in-check-out',
        loadChildren: () =>
          import('./check-in-check-out/check-in-check-out.routes').then(
            (m) => m.DASHBOARD_CHECK_IN_CHECK_OUT_ROUTES
          ),
      },
      {
        path: 'guests',
        loadChildren: () =>
          import('./guests/guests.routes').then(
            (m) => m.GUESTS_ROUTES
          ),
      },
      {
        path: '**',
        redirectTo: 'reservations',
      },
    ],
  },
];
