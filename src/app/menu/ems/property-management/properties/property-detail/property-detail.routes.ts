import { Routes } from '@angular/router';

export const PROPERTY_DETAIL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./property-detail.component').then((m) => m.PropertyDetailComponent),
    children: [
        {
            path: '',
            redirectTo: 'summary',
            pathMatch: 'full',
      },
      {
        path: 'summary',
        loadComponent: () =>
          import('./tabs/summary/summary.component').then((m) => m.PropertySummaryComponent), 
      },
      {
        path: 'units',
        loadChildren: () =>
          import('./tabs/units/unit.routes').then((m) => m.PROPERTY_UNITS_ROUTES), 
      },
      {
        path: 'notes',
        loadComponent: () =>
          import('./tabs/notes/notes.component').then((m) => m.PropertyNotesComponent),
      },
      {
        path: 'files',
        loadComponent: () =>
          import('./tabs/files/files.component').then((m) => m.PropertyFilesComponent),
      },
    ]
  },
];