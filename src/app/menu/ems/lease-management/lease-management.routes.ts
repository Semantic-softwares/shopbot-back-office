import { Routes } from '@angular/router';

export const LEASE_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./lease-management').then((m) => m.LeaseManagementComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./lease-list/lease-list.component').then(
            (m) => m.LeaseListComponent,
          ),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./lease-create-wizard/lease-create-wizard.component').then(
            (m) => m.LeaseCreateWizardComponent,
          ),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./lease-create-wizard/lease-create-wizard.component').then(
            (m) => m.LeaseCreateWizardComponent,
          ),
      },
      {
        path: ':id/end',
        loadComponent: () =>
          import('./lease-closeout/lease-closeout.component').then(
            (m) => m.LeaseCloseoutComponent,
          ),
      },
      {
        path: ':id',
        loadChildren: () =>
          import('./lease-detail/lease-detail.routes').then(
            (m) => m.LEASE_DETAIL_ROUTES,
          ),
      },
    ],
  },
];
