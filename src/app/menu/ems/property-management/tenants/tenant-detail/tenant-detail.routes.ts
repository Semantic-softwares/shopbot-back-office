import { Routes } from '@angular/router';
import { TenantDetailPageComponent } from './tenant-detail-page.component';

export const TENANT_DETAIL_ROUTES: Routes = [
  {
    path: '',
    component: TenantDetailPageComponent,
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./tabs/profile/profile.component').then(
            (m) => m.TenantProfileComponent,
          ),
      },
      {
        path: 'leases',
        loadComponent: () =>
          import('./tabs/leases/leases.component').then(
            (m) => m.TenantLeasesComponent,
          ),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./tabs/invoices/invoices.component').then(
            (m) => m.TenantInvoicesComponent,
          ),
      },
      {
        path: 'activities',
        loadComponent: () =>
          import('./tabs/activities/activities.component').then(
            (m) => m.TenantActivitiesComponent,
          ),
      },
    ],
  },
];
