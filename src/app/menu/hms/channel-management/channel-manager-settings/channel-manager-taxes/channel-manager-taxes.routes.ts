import { Routes } from '@angular/router';

export const TAXES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./channel-manager-taxes').then((m) => m.ChannelManagerTaxes),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./channel-manager-list-taxes/channel-manager-list-taxes').then(
            (m) => m.ChannelManagerListTaxes,
          ),
      },
    ],
  },
];
