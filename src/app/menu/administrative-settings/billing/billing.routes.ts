import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./billing').then(m => m.Billing),
    // children: [
    //   {
    //     path: '',
    //     loadComponent: () => import('./staff-account/staff-account').then(m => m.StaffAccount)
    //   },
    //   {
    //     path: 'roles',
    //     loadComponent: () => import('./roles/roles').then(m => m.Roles)
    //   },
    
    // ]
  }
];