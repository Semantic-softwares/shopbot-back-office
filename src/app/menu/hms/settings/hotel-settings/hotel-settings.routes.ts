import { Routes } from '@angular/router';

export const HOTEL_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./hotel-settings.component').then(m => m.HotelSettingsComponent),
    children: [
      {
        path: '',
        redirectTo: 'info',
        pathMatch: 'full'
      },
      // Hotel Settings
      {
        path: 'info',
        loadComponent: () => import('./hotel-info/hotel-info').then(m => m.HotelInfo)
      },
      {
        path: 'printer',
        loadComponent: () => import('./printer-settings/printer-settings').then(m => m.PrinterSettings)
      },
      {
        path: 'email',
        loadComponent: () => import('./email-settings/email-settings').then(m => m.EmailSettings)
      },
      {
        path: 'notification',
        loadComponent: () => import('./notifications-settings/notifications-settings').then(m => m.NotificationsSettings)
      },
      {
        path: 'team',
        loadChildren: () => import('./team/team.routes').then(m => m.TEAM_ROUTES)
      },
      {
        path: 'billing',
        loadChildren: () => import('./billing/billing.routes').then(m => m.BILLING_ROUTES)
      }
    ]
  }
];