import { Routes } from '@angular/router';

export const DASHBOARD_CHANNEL_MANAGER_POLICIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./channel-manager-policies').then(m => m.ChannelManagerPolicies),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./channel-manager-list-policies/channel-manager-list-policies').then(m => m.ChannelManagerListPolicies)
      },
      {
        path: 'create',
        loadComponent: () => import('./channel-manager-create-policies/channel-manager-create-policies').then(m => m.ChannelManagerCreatePolicies)
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./channel-manager-create-policies/channel-manager-create-policies').then(m => m.ChannelManagerCreatePolicies)
      }
    ]
  }
];