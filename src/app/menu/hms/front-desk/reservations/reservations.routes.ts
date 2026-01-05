import { Routes } from '@angular/router';
import { roleGuard } from '../../../../shared/guards/role.guard';

export const reservationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./reservations.component').then((c) => c.ReservationsComponent),
    children: [
      {
        path: '',
        redirectTo: 'view',
        pathMatch: 'full',
      },
      {
        path: 'view',
        loadChildren: () =>
          import('./reservation-view/reservations-view.routes').then(
            (c) => c.RESERVATION_VIEW_ROUTES
          ),
        title: 'Reservations - Hotel Management',
        canActivate: [roleGuard],
        data: { requiredPermission: 'hotel.reservations.view' }
      },
       
      {
        path: 'create',
        loadComponent: () =>
          import('./reservation-form/reservation-form.component').then(
            (c) => c.ReservationFormComponent
          ),
        title: 'New Reservation - Hotel Management',
        canActivate: [roleGuard],
        data: { requiredPermission: 'hotel.reservations.create' }
      },
      {
        path: 'edit/:id',
        loadComponent: () =>
          import('./reservation-form/reservation-form.component').then(
            (c) => c.ReservationFormComponent
          ),
        title: 'Edit Reservation - Hotel Management',
        canActivate: [roleGuard],
        data: { requiredPermission: 'hotel.reservations.edit' }
      },
      {
        path: 'details/:id',
        loadComponent: () =>
          import('./reservation-details/reservation-details.component').then(
            (c) => c.ReservationDetailsComponent
          ),
        title: 'Reservation Details - Hotel Management',
        canActivate: [roleGuard],
        data: { requiredPermission: 'hotel.reservations.view' }
      },

    ],
  },
];
