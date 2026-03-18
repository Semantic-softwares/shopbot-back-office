import { Routes } from '@angular/router';

export const CHANNEL_MANAGER_WEBHOOKS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-webhooks/list-webhooks').then(m => m.ListWebhooks)
  }
];
