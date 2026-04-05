import { Routes } from '@angular/router';

export const RENTAL_OWNER_DETAIL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./rental-owner-detail.component').then(
        (m) => m.RentalOwnerDetailComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'summary',
        pathMatch: 'full',
      },
      {
        path: 'summary',
        loadComponent: () =>
          import('./tabs/summary/summary.component').then(
            (m) => m.RentalOwnerSummaryComponent,
          ),
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('./tabs/properties/properties.component').then(
            (m) => m.RentalOwnerPropertiesComponent,
          ),
      },
      {
        path: 'notes',
        loadComponent: () =>
          import('./tabs/notes/notes.component').then(
            (m) => m.RentalOwnerNotesComponent,
          ),
      },
      {
        path: 'files',
        loadComponent: () =>
          import('./tabs/files/files.component').then(
            (m) => m.RentalOwnerFilesComponent,
          ),
      },
    ],
  },
];
