import { Routes } from '@angular/router';

export const DASHBOARD_REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./reports.component').then((m) => m.ReportsComponent),
    children: [
      {
        path: '',
        redirectTo: 'summary',
        pathMatch: 'full',
      },
      {
        path: 'summary',
        loadComponent: () => import('./summary/summary.component').then(m => m.SummaryComponent)
      },
      {
        path: 'sales-by-item',
        loadComponent: () =>
          import('./sales-by-item/sales-by-item.component').then((m) => m.SalesByItemComponent),
      },
      {
        path: 'sales-by-category',
        loadComponent: () =>
          import('./sales-by-category/sales-by-category.component').then((m) => m.SalesByCategoryComponent),
      },
      {
        path: 'sales-by-employee',
        loadComponent: () =>
          import('./sales-by-employee/sales-by-employee.component').then((m) => m.SalesByEmployeeComponent),
      },
      {
        path: 'sales-by-payment-type',
        loadComponent: () =>
          import('./sales-by-payment/sales-by-payment.component').then((m) => m.SalesByPaymentComponent),
      },
      {
        path: 'receipts',
        loadComponent: () =>
          import('./receipts/receipts.component').then((m) => m.ReceiptsComponent),
      },
    ],
  },
];
