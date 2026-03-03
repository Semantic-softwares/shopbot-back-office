import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./inventory-calendar.component').then(m => m.InventoryCalendarComponent),
  },
];
