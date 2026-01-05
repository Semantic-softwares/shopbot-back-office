import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StoreStore } from '../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-hotel-settings',
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
  templateUrl: './hotel-settings.component.html',
  styleUrl: './hotel-settings.component.scss',
})
export class HotelSettingsComponent {
  public storeStore = inject(StoreStore);

  // State signals
  loading = signal(false);

  // Navigation links for tabs
  navLinks = [
    { path: 'info', label: 'Hotel Info', icon: 'business', iconColor: 'text-blue-600' },
    { path: 'printer', label: 'Printer', icon: 'print', iconColor: 'text-green-600' },
    { path: 'email', label: 'Email', icon: 'email', iconColor: 'text-orange-600' },
    { path: 'notification', label: 'Notifications', icon: 'notifications', iconColor: 'text-red-600' },
    { path: 'team', label: 'Teams', icon: 'people', iconColor: 'text-purple-600' },
    { path: 'billing', label: 'Billing', icon: 'credit_card', iconColor: 'text-yellow-600' },
  ];

  
}
