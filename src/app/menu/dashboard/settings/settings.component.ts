import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { StoreStore } from '../../../shared/stores/store.store';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
    public storeStore = inject(StoreStore);

  // State signals
  loading = signal(false);

  // Navigation links for tabs
  navLinks = [
    { path: 'info', label: 'Store Info', icon: 'business', iconColor: 'text-blue-600' },
    { path: 'receipt', label: 'Receipt', icon: 'print', iconColor: 'text-green-600' },
    { path: 'print-jobs', label: 'Print Jobs', icon: 'print', iconColor: 'text-green-600' },
    // { path: 'notification', label: 'Notifications', icon: 'notifications', iconColor: 'text-red-600' },
    { path: 'team', label: 'Staff', icon: 'people', iconColor: 'text-purple-600' },
  ];

}
