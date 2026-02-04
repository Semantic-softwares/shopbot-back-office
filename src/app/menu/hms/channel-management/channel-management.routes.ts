import { Routes } from '@angular/router';

export const DASHBOARD_CHANNEL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./channel-management').then(m => m.ChannelManagement),
    children: [
      {
        path: '',
        redirectTo: 'mappings',
        pathMatch: 'full'
      },
      {
        path: 'mappings',
        loadComponent: () => import('./channel-management-mapping/channel-management-mapping').then(m => m.ChannelManagementMapping)
      },
      {
        path: 'inventory-rates',
        loadComponent: () => import('./inventory-rates/inventory-rates.component').then(m => m.InventoryRatesComponent)
      },
      {
        path: 'settings',
        loadChildren: () => import('./channel-manager-settings/channel-manager-settings.routes').then(m => m.CHANNEL_MANAGER_SETTINGS_ROUTES)
      },
      {
        path: 'live-booking',
        loadChildren: () => import('./live-booking/live-booking.route').then(m => m.DASHBOARD_LIVE_BOOKING_ROUTES)
      },
    ]
  }
];