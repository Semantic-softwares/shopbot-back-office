import { Routes } from '@angular/router';

export const RENTAL_OWNERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./rental-owners.component').then((m) => m.RentalOwnersComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./rental-owner-list/rental-owner-list.component').then(
            (m) => m.RentalOwnerListComponent,
          ),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./rental-owner-form/rental-owner-form.component').then(
            (m) => m.RentalOwnerFormComponent,
          ),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./rental-owner-form/rental-owner-form.component').then(
            (m) => m.RentalOwnerFormComponent,
          ),
      },
      {
        path: ':id',
        loadChildren: () =>
          import('./rental-owner-detail/rental-owner-detail.routes').then(
            (m) => m.RENTAL_OWNER_DETAIL_ROUTES,
          ),
      },
    ],
  },
];
