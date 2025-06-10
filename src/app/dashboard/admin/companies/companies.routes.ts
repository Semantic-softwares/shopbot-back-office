import { Routes } from '@angular/router';

export const COMPANIES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./companies.component').then(m => m.CompaniesComponent),
        children: [
            {
              path: '',
              redirectTo: 'list',
              pathMatch: 'full'
            },
            {
                path: 'list',
                loadComponent: () => import('./list-companies/list-companies.component').then(m => m.ListCompaniesComponent)
            },
            {
                path: 'details/:id',
                loadComponent: () => import('./company-details/company-details.component').then(m => m.CompanyDetailsComponent)
            }
        ]
    }
];
