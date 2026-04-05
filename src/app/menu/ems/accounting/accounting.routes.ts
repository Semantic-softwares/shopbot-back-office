import { Routes } from '@angular/router';

export const ACCOUNTING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./accounting.component').then((m) => m.AccountingComponent),
    children: [
      {
        path: 'invoices',
        loadChildren: () =>
          import('./invoices/invoices.routes').then(
            (m) => m.INVOICES_ROUTES,
          ),
      },
      {
        path: 'payments',
        loadChildren: () =>
          import('./payments/payments.routes').then(
            (m) => m.PAYMENTS_ROUTES,
          ),
      },
      {
        path: 'receipts',
        loadChildren: () =>
          import('./receipts/receipts.routes').then(
            (m) => m.RECEIPTS_ROUTES,
          ),
      },
      {
        path: 'ledger',
        loadChildren: () =>
          import('./ledger/ledger.routes').then(
            (m) => m.LEDGER_ROUTES,
          ),
      },
      {
        path: '',
        redirectTo: 'invoices',
        pathMatch: 'full',
      },
    ],
  },
];
