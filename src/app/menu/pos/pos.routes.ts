import { Routes } from '@angular/router';
import { roleGuard } from '../../shared/guards/role.guard';

export const DASHBOARD_POS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pos').then(m => m.Pos),
        children: [
            {
                path: '',
                redirectTo: 'checkout',
                pathMatch: 'full',
            },
            {
                path: 'checkout',
                loadChildren: () => import('./checkout/checkout.routes').then(m => m.CHECKOUT_ROUTES),
            },
            {
                path: 'tables',
                loadChildren: () => import('./tables/tables.routes').then(m => m.TABLES_ROUTES),
            },
            {
                path: 'orders',
                loadChildren: () => import('./orders/orders.routes').then(m => m.ORDERS_ROUTES),
            },
            {
                path: '**',
                redirectTo: 'checkout'
            }
        ]
    }
];