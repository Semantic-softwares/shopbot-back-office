import { Routes } from '@angular/router';

export const KITCHEN_DISPLAY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./kitchen-display').then((m) => m.KitchenDisplay),
  },
];
