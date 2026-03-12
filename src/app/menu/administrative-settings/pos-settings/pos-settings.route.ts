import { Routes } from '@angular/router';
import { PosSettings } from './pos-settings';

export const POS_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: PosSettings,
    children: [
      {
        path: '',
        redirectTo: 'receipt',
        pathMatch: 'full',
      },
      {
        path: 'receipt',
        loadComponent: () =>
          import('./receipt-settings/receipt-settings').then(
            (m) => m.ReceiptSettings
          ),
      },
     {
        path: 'printers',
        loadChildren: () =>
          import('./printers/printers.routes').then(
            (m) => m.PRINTERS_ROUTES
          ),
      },
    ]
  },
];