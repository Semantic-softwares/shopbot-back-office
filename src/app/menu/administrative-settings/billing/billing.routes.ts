import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../../pages/billing/owner/owner-billing.page').then((m) => m.OwnerBillingPage),
  },
];
