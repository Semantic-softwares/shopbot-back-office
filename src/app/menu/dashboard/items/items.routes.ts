import { Routes } from '@angular/router';

export const DASHBOARD_ITEMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./items.component').then((m) => m.ItemsComponent),
    children: [
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full',
      },
      {
        path: 'products',
        loadComponent: () => import('./products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'create-product',
        loadComponent: () => import('./products/create-product/create-product.component').then(m => m.CreateProductComponent)
      },
      {
        path: 'edit-product/:id',
        loadComponent: () => import('./products/create-product/create-product.component').then(m => m.CreateProductComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./categories/categories.component').then(m => m.CategoriesComponent)
      },
      {
        path: 'variants',
        loadComponent: () => import('./variants/variants.component').then(m => m.VariantsComponent)
      },
      {
        path: 'options',
        loadComponent: () => import('./options/options.component').then(m => m.OptionsComponent)
      }
    ],
  },
];
