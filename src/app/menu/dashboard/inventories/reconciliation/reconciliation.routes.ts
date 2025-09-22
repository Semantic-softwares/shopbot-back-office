import { Routes } from '@angular/router';

export const RECONCILIATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-reconciliation/list-reconciliation.component').then((m) => m.ListReconciliationComponent),
  },
  {
    path: 'start',
    loadComponent: () =>
      import('./start-reconciliation/start-reconciliation.component').then((m) => m.StartReconciliationComponent),
  },
  {
    path: ':id/count',
    loadComponent: () =>
      import('./count-inventory/count-inventory.component').then((m) => m.CountInventoryComponent),
  },
  {
    path: ':id/review',
    loadComponent: () =>
      import('./review-reconciliation/review-reconciliation.component').then((m) => m.ReviewReconciliationComponent),
  },
  {
    path: ':id/details',
    loadComponent: () =>
      import('./reconciliation-details/reconciliation-details.component').then((m) => m.ReconciliationDetailsComponent),
  },
];
