import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./users.component').then(m => m.UsersComponent),
        children: [
            {
                path: '',
                redirectTo: 'list',
                pathMatch: 'full',
            },
            {
                path: 'list',
                loadComponent: () => import('./list-users/list-users.component').then(m => m.ListUsersComponent)
            },
            {
                path: 'details/:id',
                loadComponent: () => import('./user-details/user-details.component').then(m => m.UserDetailsComponent)
            }
        ]
    }
];
