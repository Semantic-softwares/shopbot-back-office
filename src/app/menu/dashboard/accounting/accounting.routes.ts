import { Routes } from '@angular/router';

export const DASHBOARD_ACCOUNTING_ROUTES: Routes = [
  { path: '', redirectTo: 'tax-management', pathMatch: 'full' },
  {
    path: 'tax-management',
    loadComponent: () => import('./tax-management/tax-management.component').then((m) => m.TaxManagementComponent),
  },
  {
    path: 'tax-report',
    loadComponent: () => import('./tax-report/tax-report.component').then((m) => m.TaxReportComponent),
  },
];
