import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./orders').then((m) => m.Orders),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./list-orders/list-orders').then((m) => m.ListOrders),
      },
      {
        path: ':id/details',
        loadComponent: () =>
          import('./../../dashboard/reports/receipts/receipts-details/receipts-details.component').then(
            (m) => m.ReceiptsDetailsComponent
          ),
      },
    ],
  },
];
