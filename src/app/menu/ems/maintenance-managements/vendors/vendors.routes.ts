import { Routes } from '@angular/router';

export const VENDOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./vendors.component').then((m) => m.VendorsComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./vendor-list/vendor-list.component').then((m) => m.VendorListComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./vendor-detail/vendor-detail.component').then((m) => m.VendorDetailComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./vendor-form/vendor-form.component').then((m) => m.VendorFormComponent),
      },
    ],
  },
];
