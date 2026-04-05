import { Routes } from '@angular/router';
import { roleGuard } from '../../../../shared/guards/role.guard';

export const PROPERTIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./properties.component').then((m) => m.PropertiesComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'tabs/properties',
      },
      {
        path: 'tabs',
        loadComponent: () => import('./property-tabs/property-tabs').then((m) => m.PropertyTabs),
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'properties',
          },
          {
            path: 'properties',
            loadComponent: () =>
              import('./property-tabs/property-list/property-list.component').then(
                (m) => m.PropertyListComponent,
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
            path: 'units',
            loadComponent: () =>
              import('./property-tabs/unit-list/unit-list.component').then(
                (m) => m.PropertyTabsUnitListComponent,
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
        ],
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./property-form/property-form.component').then(
            (m) => m.PropertyFormComponent,
          ),
        canActivate: [roleGuard],
        data: {
          requiredPermissions: ['estate.properties.create'],
          permissionMode: 'any',
        },
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./property-form/property-form.component').then(
            (m) => m.PropertyFormComponent,
          ),
        canActivate: [roleGuard],
        data: {
          requiredPermissions: ['estate.properties.edit'],
          permissionMode: 'any',
        },
      },
      {
        path: ':id',
        loadChildren: () =>
          import('./property-detail/property-detail.routes').then(
            (m) => m.PROPERTY_DETAIL_ROUTES,
          ),
        canActivate: [roleGuard],
        data: {
          requiredPermissions: ['estate.properties.view'],
          permissionMode: 'any',
        },
      },
    ],
  },
];
