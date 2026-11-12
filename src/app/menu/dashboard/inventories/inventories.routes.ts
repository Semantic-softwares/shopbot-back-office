import { Routes } from '@angular/router';

export const DASHBOARD_INVENTORIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./inventories.component').then((m) => m.InventoriesComponent),
    children: [
      {
        path: '',
        redirectTo: 'items',
        pathMatch: 'full',
      },
      {
        path: 'items',
        children: [
          { path: '', loadComponent: () => import('./stock/items-list.component').then((m) => m.InventoryItemsComponent) },
          { path: ':id', loadComponent: () => import('./stock/item-detail.component').then((m) => m.InventoryItemDetailComponent) },
        ],
      },
      { path: 'locations', loadComponent: () => import('./stock/locations.component').then((m) => m.InventoryLocationsComponent) },
      {
        path: 'stocktakes',
        children: [
          { path: '', loadComponent: () => import('./stock/stocktakes.component').then((m) => m.StocktakesComponent) },
          { path: ':id', loadComponent: () => import('./stock/stocktakes.component').then((m) => m.StocktakeDetailComponent) },
        ],
      },
      { path: 'reports', loadComponent: () => import('./stock/inventory-reports.component').then((m) => m.InventoryReportsComponent) },
      {
        path: 'suppliers',
        loadChildren: () =>
          import('./suppliers/suppliers.routes').then((m) => m.DASHBOARD_SUPPLIERS_ROUTES),
      },
      {
        path: 'purchasing',
        loadChildren: () =>
          import('./purchasing/purchasing.routes').then((m) => m.PURCHASING_ROUTES),
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
