import { Routes } from '@angular/router';

export const TAX_SETS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./channel-manager-tax-sets').then((m) => m.ChannelManagerTaxSets),
    children: [
        {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./channel-manager-list-tax-sets/channel-manager-list-tax-sets').then(
            (m) => m.ChannelManagerListTaxSets,
          ),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./channel-manager-create-tax-sets/channel-manager-create-tax-sets').then(
            (m) => m.ChannelManagerCreateTaxSets,
          ),
      },
      {
        path: 'edit/:id',
        loadComponent: () =>
          import('./channel-manager-create-tax-sets/channel-manager-create-tax-sets').then(
            (m) => m.ChannelManagerCreateTaxSets,
          ),
      },
      
    ],
  },
];
