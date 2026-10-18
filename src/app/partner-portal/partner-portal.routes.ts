import { Routes } from '@angular/router';
import { partnerPortalGuard } from './partner-portal.guard';

export const PARTNER_PORTAL_ROUTES: Routes = [
  { path: 'login', loadComponent: () => import('./partner-login.component').then((m) => m.PartnerLoginComponent) },
  { path: 'accept-invite/:token', loadComponent: () => import('./partner-accept-invite.component').then((m) => m.PartnerAcceptInviteComponent) },
  {
    path: '',
    loadComponent: () => import('./partner-shell.component').then((m) => m.PartnerShellComponent),
    canActivate: [partnerPortalGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'search' },
      { path: 'search', loadComponent: () => import('./partner-search.component').then((m) => m.PartnerSearchComponent) },
      { path: 'requests', loadComponent: () => import('./partner-requests.component').then((m) => m.PartnerRequestsComponent) },
      { path: 'reservations', loadComponent: () => import('./partner-reservations.component').then((m) => m.PartnerReservationsComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
