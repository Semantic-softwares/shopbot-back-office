import { Routes } from '@angular/router';

/** The Sales section: register sessions, cash movements, reconciliation and register reports. Shown only for a store that uses registers. */
export const DASHBOARD_SALES_ROUTES: Routes = [
  { path: '', redirectTo: 'sessions', pathMatch: 'full' },
  { path: 'sessions', loadComponent: () => import('./register-sessions/register-sessions.component').then((m) => m.RegisterSessionsComponent) },
  { path: 'sessions/:id', loadComponent: () => import('./session-detail/session-detail.component').then((m) => m.SessionDetailComponent) },
  { path: 'movements', loadComponent: () => import('./cash-movements/cash-movements.component').then((m) => m.CashMovementsPageComponent) },
  { path: 'reconciliation', loadComponent: () => import('./cash-reconciliation/cash-reconciliation.component').then((m) => m.CashReconciliationComponent) },
  { path: 'reports', loadComponent: () => import('./register-reports/register-reports.component').then((m) => m.RegisterReportsComponent) },
];
