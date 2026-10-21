import { Routes } from '@angular/router';

export const PURCHASING_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./purchase-orders.component').then((m) => m.PurchaseOrdersComponent) },
  { path: 'suggestions', loadComponent: () => import('./suggestions.component').then((m) => m.PoSuggestionsComponent) },
  { path: 'outstanding', loadComponent: () => import('./outstanding.component').then((m) => m.PoOutstandingComponent) },
  { path: 'new', loadComponent: () => import('./po-form.component').then((m) => m.PoFormComponent) },
  { path: ':id/edit', loadComponent: () => import('./po-form.component').then((m) => m.PoFormComponent) },
  { path: ':id/amend', loadComponent: () => import('./po-form.component').then((m) => m.PoFormComponent) },
  { path: ':id', loadComponent: () => import('./po-detail.component').then((m) => m.PoDetailComponent) },
];
