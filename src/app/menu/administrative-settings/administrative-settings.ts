import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from "@angular/material/tabs";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StoreStore } from '../../shared/stores/store.store';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatIconModule } from "@angular/material/icon";
import { ToolbarComponent } from "../../shared/components/toolbar/toolbar.component";

@Component({
  selector: 'app-administrative-settings',
  imports: [RouterModule, MatTabsModule, PageHeaderComponent, MatProgressSpinnerModule, MatIconModule, ToolbarComponent],
  templateUrl: './administrative-settings.html',
  styleUrl: './administrative-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministrativeSettings { 
     public storeStore = inject(StoreStore);

  // State signals
  loading = signal(false);

  // Navigation links for tabs
  navLinks = [
    { path: 'info', label: 'General', icon: 'business', iconColor: 'text-blue-600' },
    { path: 'notifications', label: 'Notifications', icon: 'notifications', iconColor: 'text-red-600' },
    { path: 'pos-settings', label: 'Point of Sale', icon: 'print', iconColor: 'text-green-600' },
    { path: 'team', label: 'Team', icon: 'people', iconColor: 'text-purple-600' },
    { path: 'billing', label: 'Billing', icon: 'payment', iconColor: 'text-yellow-600' },
  ];
}
