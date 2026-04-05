import { Routes } from '@angular/router';

export const TENANTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tenants.component').then((m) => m.TenantsComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./tenant-list/tenant-list.component').then(
            (m) => m.TenantListComponent,
          ),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./tenant-form/tenant-form.component').then(
            (m) => m.TenantFormComponent,
          ),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./tenant-form/tenant-form.component').then(
            (m) => m.TenantFormComponent,
          ),
      },
      {
        path: ':id',
        loadChildren: () =>
          import('./tenant-detail/tenant-detail.routes').then(
            (m) => m.TENANT_DETAIL_ROUTES,
          ),
      },
    ],
  },
];
