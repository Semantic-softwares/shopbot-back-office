import { Routes } from '@angular/router';
import { roleGuard } from '../../../shared/guards/role.guard';

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
        canActivate: [roleGuard],
        data: {
          requiredPermissions: ['hotel.reservations.view', 'hotel.reservations.create', 'hotel.reservations.edit'],
          permissionMode: 'any'
        }
      },
      {
        path: 'guests',
        loadChildren: () =>
          import('./guests/guests.routes').then(
            (m) => m.GUESTS_ROUTES
          ),
        canActivate: [roleGuard],
        data: {
          requiredPermissions: ['hotel.guests.view', 'hotel.guests.create', 'hotel.guests.edit'],
          permissionMode: 'any'
        }
      },
      {
        path: '**',
        redirectTo: 'reservations',
      },
    ],
  },
];
