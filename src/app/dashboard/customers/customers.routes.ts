import { Routes } from '@angular/router';

export const DASHBOARD_CUSTOMERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./customers.component').then((m) => m.CustomersComponent),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        loadComponent: () => import('./list/customer-list.component').then(m => m.CustomerListComponent)
      }
    ],
  },
];
