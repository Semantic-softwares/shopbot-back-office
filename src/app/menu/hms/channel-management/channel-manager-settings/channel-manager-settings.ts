import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StoreStore } from '../../../../shared/stores/store.store';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-channel-manager-settings',
  imports: [
    RouterModule,
    PageHeaderComponent,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
  ],
  templateUrl: './channel-manager-settings.html',
  styleUrl: './channel-manager-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelManagerSettings { 
   public storeStore = inject(StoreStore);

  // State signals
  loading = signal(false);

  // Navigation links for tabs
  navLinks = [
    {
      path: 'settings-general',
      label: 'Settings',
      icon: 'settings',
      iconColor: 'text-blue-600',
    },
    {
      path: 'policies',
      label: 'Policies',
      icon: 'policy',
      iconColor: 'text-green-600',
    },
    {
      path: 'tax-sets',
      label: 'Tax Sets',
      icon: 'account_balance_wallet',
      iconColor: 'text-orange-600',
    },
    {
      path: 'taxes',
      label: 'Taxes',
      icon: 'gavel',
      iconColor: 'text-red-600',
    },
   
  ];
}
