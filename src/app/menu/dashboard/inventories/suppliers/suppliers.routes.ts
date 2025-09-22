import { Routes } from '@angular/router';

export const DASHBOARD_SUPPLIERS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./list-suppliers/list-suppliers.component').then((m) => m.ListSuppliersComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-suppliers/create-suppliers.component').then((m) => m.CreateSuppliersComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./create-suppliers/create-suppliers.component').then((m) => m.CreateSuppliersComponent),
  },
  {
    path: 'details/:id',
    loadComponent: () =>
      import('./supplier-details/supplier-details.component').then((m) => m.SupplierDetailsComponent),
  },
];
