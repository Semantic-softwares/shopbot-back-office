import { Routes } from '@angular/router';

export const PROPERTY_UNITS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./units.component').then(
        (m) => m.UnitsComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'lists',
        pathMatch: 'full',
      },
      {
        path: 'lists',
        loadComponent: () =>
          import('./unit-list/unit-list.component').then(
            (m) => m.UnitListComponent,
          ),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./unit-form/unit-form.component').then(
            (m) => m.UnitFormComponent,
          ),
      },
      {
        path: ':unitId/view',
        loadComponent: () =>
          import('./unit-detail/unit-detail.component').then(
            (m) => m.UnitDetailComponent,
          ),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./unit-form/unit-form.component').then(
            (m) => m.UnitFormComponent,
          ),
      },
    ],
  },
];
