import { Routes } from '@angular/router';

export const SUPER_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./super-admin-shell.component').then((m) => m.SuperAdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', loadComponent: () => import('./pages/overview/overview.page').then((m) => m.OverviewPage), title: 'Overview' },
      { path: 'stores', loadComponent: () => import('./pages/stores/stores.page').then((m) => m.StoresPage), title: 'Stores' },
      { path: 'stores/:storeId', loadComponent: () => import('./pages/store-detail/store-detail.page').then((m) => m.StoreDetailPage), title: 'Store' },
      { path: 'invoices', loadComponent: () => import('./pages/invoices/invoices.page').then((m) => m.InvoicesPage), title: 'Invoices' },
      { path: 'invoices/:invoiceId', loadComponent: () => import('./pages/invoice-detail/invoice-detail.page').then((m) => m.InvoiceDetailPage), title: 'Invoice' },
      { path: 'payments', loadComponent: () => import('./pages/payments/payments.page').then((m) => m.PaymentsPage), title: 'Payments' },
      { path: 'trials', loadComponent: () => import('./pages/trials/trials.page').then((m) => m.TrialsPage), title: 'Trials' },
      { path: 'requests', loadComponent: () => import('./pages/requests/requests.page').then((m) => m.RequestsPage), title: 'Plan requests' },
      { path: 'plans', loadComponent: () => import('./pages/plans/plans.page').then((m) => m.PlansPage), title: 'Plans' },
      { path: 'audit', loadComponent: () => import('./pages/audit/audit.page').then((m) => m.AuditPage), title: 'Audit log' },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage), title: 'Settings' },
    ],
  },
];
