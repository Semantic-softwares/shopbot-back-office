import { Routes } from '@angular/router';

export const RESTOCK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-restock/list-restock.component').then((m) => m.ListRestockComponent),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./add-stock/add-restock.component').then((m) => m.RestockComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./add-stock/add-restock.component').then((m) => m.RestockComponent),
  },
];
