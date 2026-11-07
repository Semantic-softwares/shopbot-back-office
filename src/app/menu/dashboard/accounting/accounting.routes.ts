import { Routes } from '@angular/router';

export const DASHBOARD_ACCOUNTING_ROUTES: Routes = [
  { path: '', redirectTo: 'tax-management', pathMatch: 'full' },
  {
    path: 'tax-management',
    loadComponent: () => import('./tax-management/tax-management.component').then((m) => m.TaxManagementComponent),
  },
  // The report moved to the Reports module; the old address keeps working.
  { path: 'tax-report', redirectTo: '/menu/erp/reports/tax-report' },
];
