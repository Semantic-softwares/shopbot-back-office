import { Routes } from '@angular/router';

export const TABLES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./tables').then(m => m.Tables),
      
    }
];