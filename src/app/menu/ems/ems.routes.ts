import { Routes } from '@angular/router';
import { roleGuard } from '../../shared/guards/role.guard';

export const DASHBOARD_EMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ems-dashboard.component').then(
        (m) => m.EmsDashboardComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/overview.component').then(
            (m) => m.EmsOverviewComponent,
          ),
        canActivate: [roleGuard],
        data: {
          requiredPermissions: [
            'estate.properties.view',
            'estate.units.view',
          ],
          permissionMode: 'any',
        },
      },
      {
        path: 'properties',
        loadChildren: () =>
          import('./property-management/property-management.routes').then(
            (m) => m.PROPERTY_MANAGEMENT_ROUTES,
          ),
        canActivate: [roleGuard],
        data: {
          requiredPermissions: [
            'estate.properties.view',
            'estate.properties.create',
          ],
          permissionMode: 'any',
        },
      },
      {
        path: 'leases',
        loadChildren: () =>
          import('./lease-management/lease-management.routes').then(
            (m) => m.LEASE_MANAGEMENT_ROUTES,
          ),
        canActivate: [roleGuard],
        data: {
          requiredPermissions: [
            'estate.leases.view',
            'estate.leases.create',
          ],
          permissionMode: 'any',
        },
      },
      {
        path: 'accounting',
        loadChildren: () =>
          import('./accounting/accounting.routes').then(
            (m) => m.ACCOUNTING_ROUTES,
          ),
        canActivate: [roleGuard],
        data: {
          requiredPermissions: [
            'estate.leases.view',
          ],
          permissionMode: 'any',
        },
      },
      {
        path: 'collections',
        loadChildren: () =>
          import('./collections/collections.routes').then(
            (m) => m.COLLECTIONS_ROUTES,
          ),
        canActivate: [roleGuard],
        data: {
          requiredPermissions: [
            'finance.arrears.view',
            'finance.collections.view',
          ],
          permissionMode: 'any',
        },
      },
      {
        path: 'maintenance',
        loadChildren: () =>
          import('./maintenance-managements/maintenance-managements.routes').then(
            (m) => m.MAINTENANCE_MANAGEMENT_ROUTES,
          ),
        canActivate: [roleGuard],
        data: {
          requiredPermissions: [
            'estate.properties.view',
            'estate.units.view',
            'estate.leases.view',
          ],
          permissionMode: 'any',
        },
      },
      {
        path: '**',
        redirectTo: 'overview',
      },
    ],
  },
];
