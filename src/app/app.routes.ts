import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { noAuthGuard } from './shared/guards/no-auth.guard';
import { roleResolver } from './shared/resolvers/role.resolver';

export const routes: Routes = [
    {
        path: '',  
        pathMatch: 'full',
        redirectTo: 'auth'
    },
    {
        path: 'auth',
        loadChildren: () => import('./authentication/authentication.routes').then(m => m.AUTH_ROUTES),
        canActivate: [noAuthGuard]
    },
    {
        path: 'menu',
        loadChildren: () => import('./menu/menu.route').then(m => m.MENU_ROUTES),
        canActivate: [authGuard],
       resolve: { role: roleResolver }
    },
];