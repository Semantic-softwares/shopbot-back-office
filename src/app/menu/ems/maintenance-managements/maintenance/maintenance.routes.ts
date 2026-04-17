import { Routes } from '@angular/router';

export const MAINTENANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./maintenance').then((m) => m.MaintenanceComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./maintenance-list').then(
            (m) => m.MaintenanceListComponent,
          ),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./maintenance-form').then(
            (m) => m.MaintenanceFormComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./maintenance-detail').then(
            (m) => m.MaintenanceDetailComponent,
          ),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./maintenance-form').then(
            (m) => m.MaintenanceFormComponent,
          ),
      },
    ],
  },
];
