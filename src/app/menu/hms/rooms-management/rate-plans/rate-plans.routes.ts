import { Routes } from '@angular/router';

export const RATE_PLANS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./rate-plans.component').then(m => m.RatePlansComponent),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./rate-plans-list/rate-plans-list.component').then(m => m.RatePlansListComponent),
      },
    ],
  },
];
