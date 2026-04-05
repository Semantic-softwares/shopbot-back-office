import { Routes } from '@angular/router';

export const PROPERTY_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./property-management').then((m) => m.PropertyManagement),
    children: [
      {
        path: 'rental-owners',
        loadChildren: () =>
          import('./rental-owners/rental-owners.routes').then(
            (m) => m.RENTAL_OWNERS_ROUTES,
          ),
      },
      {
        path: 'tenants',
        loadChildren: () =>
          import('./tenants/tenants.routes').then(
            (m) => m.TENANTS_ROUTES,
          ),
      },
      {
        path: 'properties',
        loadChildren: () =>
          import('./properties/properties.routes').then(
            (m) => m.PROPERTIES_ROUTES,
          ),
      },
      {
        path: '',
        redirectTo: 'properties',
        pathMatch: 'full',
      },
    ],
  },
];
