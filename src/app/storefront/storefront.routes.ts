import { Routes } from '@angular/router';

// '' = browse-only (/m/:storeSlug), 't/:qrToken' = table-ordering context
// (/m/:storeSlug/t/:qrToken) — same shell component resolves either way based
// on which route params are present. See storefront-shell.component.ts.
export const STOREFRONT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./storefront-shell/storefront-shell.component').then((m) => m.StorefrontShellComponent),
  },
  {
    path: 't/:qrToken',
    loadComponent: () =>
      import('./storefront-shell/storefront-shell.component').then((m) => m.StorefrontShellComponent),
  },
];
