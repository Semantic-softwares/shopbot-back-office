import { Routes } from '@angular/router';

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
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./guest-form/guest-form.component').then(
            (m) => m.GuestFormComponent
          ),
      },
      {
        path: 'edit/:id',
        loadComponent: () =>
          import('./guest-form/guest-form.component').then(
            (m) => m.GuestFormComponent
          ),
      },
      {
        path: 'details/:id',
        loadComponent: () =>
          import('./guest-details/guest-details.component').then(
            (m) => m.GuestDetailsComponent
          ),
      },
      {
        path: '**',
        redirectTo: 'list',
      },
    ],
  },
];
