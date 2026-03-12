import { Routes } from '@angular/router';
import { AdministrativeSettings } from './administrative-settings';

export const ADMINISTRATIVE_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: AdministrativeSettings,
    children: [
      {
        path: '',
        redirectTo: 'info',
        pathMatch: 'full',
      },
      {
        path: 'info',
        loadComponent: () =>
          import('./hotel-info/hotel-info').then(
            (m) => m.HotelInfo,
          ),
      },
      {
        path: 'pos-settings',
        loadChildren: () =>
          import('./pos-settings/pos-settings.route').then(
            (m) => m.POS_SETTINGS_ROUTES,
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./notifications-settings/notifications-settings').then(
            (m) => m.NotificationsSettings,
          ),
      },
      {
        path: 'team',
        loadChildren: () =>
          import('./team/team.routes').then((m) => m.TEAM_ROUTES),
      },
        {
        path: 'billing',
        loadChildren: () =>
          import('./billing/billing.routes').then((m) => m.BILLING_ROUTES),
      },
    ],
  },
];
