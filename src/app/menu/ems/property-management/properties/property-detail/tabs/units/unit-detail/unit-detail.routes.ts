import { Routes } from '@angular/router';

export const UNIT_DETAIL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./unit-detail.component').then((m) => m.UnitDetailComponent),
    children: [
      {
        path: '',
        redirectTo: 'summary',
        pathMatch: 'full',
      },
      {
        path: 'summary',
        loadComponent: () =>
          import('./tabs/summary/summary.component').then((m) => m.UnitSummaryComponent),
      },
      {
        path: 'leases',
        loadComponent: () =>
          import('./tabs/leases/leases.component').then((m) => m.UnitLeasesComponent),
      },
      {
        path: 'maintenance',
        loadComponent: () =>
          import('./tabs/maintenance/maintenance.component').then((m) => m.UnitMaintenanceComponent),
      },
    ],
  },
];
