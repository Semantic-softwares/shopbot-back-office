import { Routes } from '@angular/router';

export const DASHBOARD_RECEIPTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./receipts.component').then((m) => m.ReceiptsComponent),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./list-receipts/list-receipts.component').then(
            (m) => m.ListReceiptsComponent
          ),
      },
      {
        path: ':id/details',
        loadComponent: () =>
          import('./receipts-details/receipts-details.component').then(
            (m) => m.ReceiptsDetailsComponent
          ),
      },
    ],
  },
];
