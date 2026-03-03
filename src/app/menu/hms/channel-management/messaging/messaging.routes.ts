import { Routes } from '@angular/router';

export const MESSAGING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./messaging.component').then(m => m.MessagingComponent),
  },
  {
    path: ':threadId',
    loadComponent: () => import('./messaging.component').then(m => m.MessagingComponent),
  },
];
