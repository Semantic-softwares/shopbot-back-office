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
        loadChildren: () => import('./hotel-settings/hotel-settings.routes').then(m => m.HOTEL_SETTINGS_ROUTES)
      },
      
    ]
  }
];
