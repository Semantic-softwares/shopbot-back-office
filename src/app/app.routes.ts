import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { noAuthGuard } from './shared/guards/no-auth.guard';
import { roleResolver } from './shared/resolvers/role.resolver';
import { subscriptionResolver } from './shared/resolvers/subscription.resolver';
import { subscriptionActiveGuard } from './shared/guards/subscription-active.guard';
import { storeSelectedGuard } from './shared/guards/store-selected.guard';
import { platformAdminGuard } from './shared/guards/platform-admin.guard';

export const routes: Routes = [
    {
        path: '',  
        pathMatch: 'full',
        redirectTo: 'menu'
    },
    {
        path: 'auth',
        loadChildren: () => import('./authentication/authentication.routes').then(m => m.AUTH_ROUTES),
        canActivate: [noAuthGuard]
    },
    // Post-login store picker for a merchant with access to more than one
    // store — deliberately NOT under 'auth' (which noAuthGuard blocks once
    // logged in) since the user is already authenticated at this point.
    {
        path: 'select-store',
        loadComponent: () => import('./authentication/select-store/select-store.component').then(m => m.SelectStoreComponent),
        canActivate: [authGuard],
    },
    // The "Accept Invite" email button lands here. Deliberately NOT under
    // 'auth' either, but for the opposite reason from select-store: this
    // page must work for someone who is ALREADY logged in (the common case —
    // most invited people already use the app for another store), so
    // noAuthGuard bouncing them to /menu/menu before the page ever loads
    // would break the primary path. No guard at all: the component itself
    // checks auth state and redirects to /auth/login (preserving a
    // returnUrl back here) only when actually signed out.
    {
        path: 'accept-membership/:id',
        loadComponent: () => import('./authentication/accept-membership/accept-membership.component').then(m => m.AcceptMembershipComponent),
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
    // A locked account lands here (outside the app shell): pay, check again, or sign out.
    {
        path: 'account-locked',
        loadComponent: () => import('./pages/account-locked/account-locked.page').then(m => m.AccountLockedPage),
        canActivate: [authGuard, storeSelectedGuard],
    },
    // Paystack returns here after a payment.
    {
        path: 'billing-callback',
        loadComponent: () => import('./pages/billing/owner/billing-callback.page').then(m => m.BillingCallbackPage),
        canActivate: [authGuard],
    },
    {
        path: 'menu',
        loadChildren: () => import('./menu/menu.route').then(m => m.MENU_ROUTES),
        canActivate: [authGuard, storeSelectedGuard, subscriptionActiveGuard],
        resolve: { role: roleResolver, subscription: subscriptionResolver }
    },
    // The platform super-admin area (all stores' subscriptions, invoices, plans). Only platform admins get past the guard; the server
    // re-checks on every call. It has no store context and no subscription guard of its own.
    {
        path: 'super-admin',
        loadChildren: () => import('./menu/super-admin/super-admin.routes').then(m => m.SUPER_ADMIN_ROUTES),
        canActivate: [authGuard, platformAdminGuard],
    },
    // The travel-partner booking portal: its own sign-in and session, separate from staff. Public sign-in pages; the rest is
    // behind partnerPortalGuard inside the route file.
    {
        path: 'partner',
        loadChildren: () => import('./partner-portal/partner-portal.routes').then(m => m.PARTNER_PORTAL_ROUTES),
    },
    // Public self-service table ordering — deliberately no canActivate/resolve.
    // Scanned from a printed table QR code; must work with no auth session.
    {
        path: 'm/:storeSlug',
        loadChildren: () => import('./storefront/storefront.routes').then(m => m.STOREFRONT_ROUTES),
    },
];