import { Routes } from '@angular/router';

export const DASHBOARD_INVENTORIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./inventories.component').then((m) => m.InventoriesComponent),
    children: [
      {
        path: '',
        redirectTo: 'suppliers',
        pathMatch: 'full',
      },
      {
        path: 'suppliers',
        loadChildren: () =>
          import('./suppliers/suppliers.routes').then((m) => m.DASHBOARD_SUPPLIERS_ROUTES),
      },
      {
        path: 'restock',
        loadChildren: () =>
          import('./restock/restock.routes').then((m) => m.RESTOCK_ROUTES),
      },
      {
        path: 'reconciliations',
        loadChildren: () =>
          import('./reconciliation/reconciliation.routes').then((m) => m.RECONCILIATION_ROUTES),
      },
    ],
  },
];
