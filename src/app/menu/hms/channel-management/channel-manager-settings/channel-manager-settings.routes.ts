import { Routes } from '@angular/router';

export const CHANNEL_MANAGER_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./channel-manager-settings').then(m => m.ChannelManagerSettings),
    children: [
      {
        path: '',
        redirectTo: 'settings-general',
        pathMatch: 'full'
      },
      {
        path: 'settings-general',
        loadComponent: () => import('./channel-manager-settings-general/channel-manager-settings-general').then(m => m.ChannelManagerSettingsGeneral)
      },
      {
        path: 'policies',
        loadChildren: () => import('./channel-manager-policies/channel-manger.routes').then(m => m.DASHBOARD_CHANNEL_MANAGER_POLICIES_ROUTES)
      },
      {
        path: 'tax-sets',
        loadChildren: () => import('./channel-manager-tax-sets/channel-manager-tax-sets.routes').then(m => m.TAX_SETS_ROUTES)
      },
      {
        path: 'taxes',
        loadChildren: () => import('./channel-manager-taxes/channel-manager-taxes.routes').then(m => m.TAXES_ROUTES)
      },
    
     
    ]
  }
];