import { Routes } from '@angular/router';

export const RECEIPTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./receipts.component').then((m) => m.ReceiptsComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./receipt-list/receipt-list.component').then(
            (m) => m.ReceiptListComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./receipt-detail/receipt-detail.component').then(
            (m) => m.ReceiptDetailComponent,
          ),
      },
    ],
  },
];
