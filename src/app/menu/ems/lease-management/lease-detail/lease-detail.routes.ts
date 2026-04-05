import { Routes } from '@angular/router';

export const LEASE_DETAIL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./lease-detail-page.component').then((m) => m.LeaseDetailPageComponent),
    children: [
      {
        path: '',
        redirectTo: 'tenants',
        pathMatch: 'full',
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./tabs/tenants/tenants.component').then((m) => m.LeaseTenantsComponent),
      },
      {
        path: 'lease-transactions',
        loadComponent: () =>
          import('./tabs/lease-transactions/lease-transactions.component').then(
            (m) => m.LeaseTransactionsComponent,
          ),
      },
      {
        path: 'activities',
        loadComponent: () =>
          import('./tabs/activities/activities.component').then(
            (m) => m.LeaseActivitiesComponent,
          ),
      },
      {
        path: 'agreements-notices',
        loadComponent: () =>
          import('./tabs/agreements-notices/agreements-notices.component').then(
            (m) => m.LeaseAgreementsNoticesComponent,
          ),
      },
      {
        path: 'insurance',
        loadComponent: () =>
          import('./tabs/insurance/insurance.component').then((m) => m.LeaseInsuranceComponent),
      },
      {
        path: 'utilities',
        loadComponent: () =>
          import('./tabs/utilities/utilities.component').then((m) => m.LeaseUtilitiesComponent),
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./tabs/billing/lease-billing.component').then(
            (m) => m.LeaseBillingComponent,
          ),
      },
    ],
  },
];
