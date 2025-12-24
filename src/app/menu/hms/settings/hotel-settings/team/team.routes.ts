import { Routes } from '@angular/router';

export const TEAM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./team').then(m => m.Team),
    children: [
      {
        path: '',
        redirectTo: 'staffs',
        pathMatch: 'full'
      },
      // Hotel Settings
      {
        path: 'staffs',
        loadComponent: () => import('./staff-account/staff-account').then(m => m.StaffAccount)
      },
      {
        path: 'roles',
        loadComponent: () => import('./roles/roles').then(m => m.Roles)
      },
    
    ]
  }
];