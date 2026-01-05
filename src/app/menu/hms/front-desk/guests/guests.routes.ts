import { Routes } from '@angular/router';
import { roleGuard } from '../../../../shared/guards/role.guard';

export const GUESTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./guests.component').then((m) => m.GuestsComponent),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./list-guests/list-guests.component').then(
            (m) => m.ListGuestsComponent
          ),
        canActivate: [roleGuard],
        data: { requiredPermission: 'hotel.guests.view' }
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./guest-form/guest-form.component').then(
            (m) => m.GuestFormComponent
          ),
        canActivate: [roleGuard],
        data: { requiredPermission: 'hotel.guests.create' }
      },
      {
        path: 'edit/:id',
        loadComponent: () =>
          import('./guest-form/guest-form.component').then(
            (m) => m.GuestFormComponent
          ),
        canActivate: [roleGuard],
        data: { requiredPermission: 'hotel.guests.edit' }
      },
      {
        path: 'details/:id',
        loadComponent: () =>
          import('./guest-details/guest-details.component').then(
            (m) => m.GuestDetailsComponent
          ),
        canActivate: [roleGuard],
        data: { requiredPermission: 'hotel.guests.view' }
      },
      {
        path: '**',
        redirectTo: 'list',
      },
    ],
  },
];
