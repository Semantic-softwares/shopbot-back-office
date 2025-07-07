import { Routes } from '@angular/router';

export const DASHBOARD_TABLES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./tables.component').then(m => m.TablesComponent),
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./tables/list-tables/list-tables.component').then(m => m.ListTablesComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./table-categories/table-categories.component').then(m => m.TableCategoriesComponent),
        children: [
          {
            path: '',
            redirectTo: 'list',
            pathMatch: 'full'
          },
          {
            path: 'list',
            loadComponent: () => import('./table-categories/list-table-categories/list-table-categories.component').then(m => m.ListTableCategoriesComponent)
          }
        ]
      }
    ]
  }
];
