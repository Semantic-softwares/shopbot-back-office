import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { noAuthGuard } from './shared/guards/no-auth.guard';
import { roleResolver } from './shared/resolvers/role.resolver';
import { subscriptionResolver } from './shared/resolvers/subscription.resolver';
import { subscriptionActiveGuard } from './shared/guards/subscription-active.guard';

export const routes: Routes = [
    {
        path: '',  
        pathMatch: 'full',
        redirectTo: 'website'
    },
    {
        path: '',
        loadChildren: () => import('./website/website.routes').then(m => m.WEBSITE_ROUTES)
    },
    {
        path: 'auth',
        loadChildren: () => import('./authentication/authentication.routes').then(m => m.AUTH_ROUTES),
        canActivate: [noAuthGuard]
    },
    {
        path: 'pricing',
        loadComponent: () => import('./pages/billing/pricing/pricing-shell.component').then(m => m.PricingShellComponent),
        canActivate: [authGuard],
        resolve: { subscription: subscriptionResolver },
        children: [
            {
                path: '',
                redirectTo: 'pricing',
                pathMatch: 'full',
             
            },
            {
                path: 'pricing',
                loadComponent: () => import('./pages/billing/pricing/pricing.component').then(m => m.PricingComponent),
            },
            {
                path: 'billing',
                loadComponent: () => import('./pages/billing/billing.component').then(m => m.BillingComponent),
            },
            {
                path: 'payment-callback',
                loadComponent: () => import('./pages/billing/payment-callback/payment-callback.component').then(m => m.PaymentCallbackComponent)
            }
        ]
    },
    {
        path: 'menu',
        loadChildren: () => import('./menu/menu.route').then(m => m.MENU_ROUTES),
        canActivate: [authGuard, subscriptionActiveGuard],
        resolve: { role: roleResolver, subscription: subscriptionResolver }
    },
];