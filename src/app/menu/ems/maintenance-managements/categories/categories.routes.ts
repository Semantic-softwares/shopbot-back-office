import { Routes } from '@angular/router';

export const CATEGORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./categories.component').then((m) => m.CategoriesComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./category-list/category-list.component').then((m) => m.CategoryListComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./category-form/category-form.component').then((m) => m.CategoryFormComponent),
      },
    ],
  },
];
