import { Routes } from '@angular/router';

export const WEBSITE_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
    },
    {
        path: 'home',
        loadComponent: () => import('./home/home').then(m => m.Home)
    },
    {
        path: 'downloads',
        loadComponent: () => import('./downloads/downloads').then(m => m.Downloads)
    },
    {
        path: 'features/:slug',
        loadComponent: () => import('./features/feature-detail').then(m => m.FeatureDetailComponent)
    },
];
