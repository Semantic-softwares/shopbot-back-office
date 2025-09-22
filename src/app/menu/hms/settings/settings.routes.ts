import { Routes } from '@angular/router';

export const SETTINGS_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings.component').then(m => m.SettingsComponent),
    children: [
      {
        path: '',
        redirectTo: 'hotel-settings',
        pathMatch: 'full'
      },
      // Hotel Settings
      {
        path: 'hotel-settings',
        loadComponent: () => import('./hotel-settings/hotel-settings.component').then(m => m.HotelSettingsComponent)
      },
      
    ]
  }
];
