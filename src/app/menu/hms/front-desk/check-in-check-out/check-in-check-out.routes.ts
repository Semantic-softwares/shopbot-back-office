import { Routes } from '@angular/router';

export const DASHBOARD_CHECK_IN_CHECK_OUT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./check-in-check-out.component').then((m) => m.CheckInCheckOutComponent),
    children: [
      {
        path: '',
        redirectTo: 'check-in-check-out-list',
        pathMatch: 'full',
      },
      
      {
        path: 'check-in-check-out-list',
        loadComponent: () =>
          import('./check-in-check-out-list/check-in-check-out-list.component').then(
            (m) => m.CheckInCheckOutListComponent
          ),
      },

      {
        path: 'details/:id',
        loadComponent: () =>
          import('./check-in-check-out-details/check-in-check-out-details.component').then(
            (m) => m.CheckInCheckOutDetailsComponent
          ),
      },
     
      {
        path: '**',
        redirectTo: 'check-in-check-out-list',
      },
    ],
  },
];