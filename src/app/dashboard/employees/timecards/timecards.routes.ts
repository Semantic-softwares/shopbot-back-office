import { Routes } from '@angular/router';

export const TIMECARDS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./timecards.component').then(m => m.TimecardsComponent),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./list-timecards/list-timecards.component').then(m => m.ListTimecardsComponent)
      }
    ]
  }
];
