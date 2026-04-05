import { Routes } from '@angular/router';

export const PAYMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./payments.component').then((m) => m.PaymentsComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./payment-list/payment-list.component').then(
            (m) => m.PaymentListComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./payment-detail/payment-detail.component').then(
            (m) => m.PaymentDetailComponent,
          ),
      },
    ],
  },
];
