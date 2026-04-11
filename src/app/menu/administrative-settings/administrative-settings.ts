import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from "@angular/material/tabs";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StoreStore } from '../../shared/stores/store.store';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatIconModule } from "@angular/material/icon";
import { ToolbarComponent } from "../../shared/components/toolbar/toolbar.component";
import { SubscriptionService } from '../../shared/services/subscription.service';
import { SubscriptionWithModules, ModuleKey } from '../../shared/models/subscription.model';

@Component({
  selector: 'app-administrative-settings',
  imports: [RouterModule, MatTabsModule, PageHeaderComponent, MatProgressSpinnerModule, MatIconModule, ToolbarComponent],
  templateUrl: './administrative-settings.html',
  styleUrl: './administrative-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministrativeSettings { 
  public storeStore = inject(StoreStore);
  private subscriptionService = inject(SubscriptionService);

  // State signals
  loading = signal<boolean>(false);
  private subscriptionDetails = signal<SubscriptionWithModules | null>(null);

  private readonly activeModuleKeys = computed<ModuleKey[]>(() => {
    const details = this.subscriptionDetails();
    if (!details) return [];
    return details.modules
      .filter((m) => m.status === 'ACTIVE')
      .map((m) => m.moduleKey);
  });

  // All possible navigation links
  private readonly allNavLinks = [
    { path: 'info', label: 'General', icon: 'business', iconColor: 'text-blue-600', module: null },
    { path: 'notifications', label: 'Notifications', icon: 'notifications', iconColor: 'text-red-600', module: null },
    { path: 'pos-settings', label: 'Point of Sale', icon: 'print', iconColor: 'text-green-600', module: 'POS' as ModuleKey },
    { path: 'team', label: 'Team', icon: 'people', iconColor: 'text-purple-600', module: null },
    { path: 'billing', label: 'Billing', icon: 'payment', iconColor: 'text-yellow-600', module: null },
  ];

  // Filtered nav links based on active modules
  readonly navLinks = computed(() =>
    this.allNavLinks.filter((link) =>
      link.module === null || this.activeModuleKeys().includes(link.module),
    ),
  );

  constructor() {
    this.subscriptionService.getSubscriptionWithModules().subscribe({
      next: (data: SubscriptionWithModules) => this.subscriptionDetails.set(data),
      error: () => {},
    });
  }
}
