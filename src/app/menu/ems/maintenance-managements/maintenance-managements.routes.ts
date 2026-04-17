import { Routes } from '@angular/router';

export const MAINTENANCE_MANAGEMENT_ROUTES: Routes = [
   {
    path: '',
    redirectTo: 'maintenances',
    pathMatch: 'full',
   },
  {
    path: 'maintenances',
    loadChildren: () => import('./maintenance/maintenance.routes').then((m) => m.MAINTENANCE_ROUTES),
  },
  {
    path: 'vendors',
    loadChildren: () => import('./vendors/vendors.routes').then((m) => m.VENDOR_ROUTES),
  },
  {
    path: 'categories',
    loadChildren: () => import('./categories/categories.routes').then((m) => m.CATEGORY_ROUTES),
  },
];
