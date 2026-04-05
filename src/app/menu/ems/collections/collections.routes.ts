import { Routes } from '@angular/router';
import { roleGuard } from '../../../shared/guards/role.guard';

export const COLLECTIONS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'arrears',
    pathMatch: 'full',
  },
  {
    path: 'arrears',
    loadComponent: () =>
      import('./arrears-page/arrears-page.component').then(
        (m) => m.ArrearsPageComponent,
      ),
    canActivate: [roleGuard],
    data: {
      requiredPermissions: ['finance.arrears.view', 'finance.collections.view'],
      permissionMode: 'any',
    },
  },
];
