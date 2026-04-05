import { Routes } from '@angular/router';

export const LEDGER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ledger.component').then((m) => m.LedgerComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./ledger-list/ledger-list.component').then(
            (m) => m.LedgerListComponent,
          ),
      },
    ],
  },
];
