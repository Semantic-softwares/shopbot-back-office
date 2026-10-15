import { Routes } from '@angular/router';
import { AuthenticationComponent } from './authentication.component';

// AuthenticationComponent is the shared shell for every signed-out page (it hosts the
// theme/language menu), so these routes are its children rather than top-level.
export const AUTH_ROUTES: Routes = [
    {
        path: '',
        component: AuthenticationComponent,
        children: [
        {
            path: '',
            redirectTo: 'login',
            pathMatch: 'full',
        },
        {
            path: 'login',
            loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
        },
        {
            path: 'signup',
            loadComponent: () => import('./signup/signup.component').then(m => m.SignupComponent)
        },
        {
            path: 'accept-invite/:token',
            loadComponent: () => import('./accept-invite/accept-invite.component').then(m => m.AcceptInviteComponent)
        },
        {
            path: 'forgot-password',
            loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
        },
        {
            path: 'verify-reset-token',
            loadComponent: () => import('./verify-reset-token/verify-reset-token.component').then(m => m.VerifyResetTokenComponent)
        },
        {
            path: 'reset-password',
            loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
        }
        ],
    },
];
