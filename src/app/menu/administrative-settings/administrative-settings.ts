import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from "@angular/material/tabs";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StoreStore } from '../../shared/stores/store.store';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatIconModule } from "@angular/material/icon";
import { ToolbarComponent } from "../../shared/components/toolbar/toolbar.component";
import { SubscriptionService } from '../../shared/services/subscription.service';
import { MraEinvoicingService } from '../../shared/services/mra-einvoicing.service';
import { ModuleKey } from '../../shared/models/subscription.model';
import { TrPipe } from '../../shared/i18n/tr.pipe';

@Component({
  selector: 'app-administrative-settings',
  imports: [TrPipe, RouterModule, MatTabsModule, PageHeaderComponent, MatProgressSpinnerModule, MatIconModule, ToolbarComponent],
  templateUrl: './administrative-settings.html',
  styleUrl: './administrative-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministrativeSettings { 
  public storeStore = inject(StoreStore);
  private subscriptionService = inject(SubscriptionService);
  private fiscalisation = inject(MraEinvoicingService);

  // State signals
  loading = signal<boolean>(false);

  private readonly activeModuleKeys = this.subscriptionService.activeModuleKeys;

  // All possible navigation links
  private readonly allNavLinks = [
    { path: 'info', label: $localize`General`, icon: 'business', iconColor: 'text-blue-600', module: null },
    { path: 'notifications', label: $localize`Notifications`, icon: 'notifications', iconColor: 'text-red-600', module: null },
    { path: 'pos-settings', label: $localize`Point of Sale`, icon: 'print', iconColor: 'text-green-600', module: 'POS' as ModuleKey },
    { path: 'self-order', label: $localize`Self-Order Menu`, icon: 'qr_code_2', iconColor: 'text-orange-600', module: 'POS' as ModuleKey },
    { path: 'delivery', label: $localize`Delivery`, icon: 'local_shipping', iconColor: 'text-teal-600', module: 'POS' as ModuleKey },
    { path: 'operational-orders', label: $localize`Operational Orders`, icon: 'schedule', iconColor: 'text-cyan-600', module: 'POS' as ModuleKey },
    { path: 'kitchen-stations', label: $localize`Kitchen Stations`, icon: 'soup_kitchen', iconColor: 'text-red-600', module: 'KDS' as ModuleKey },
    { path: 'mra-einvoicing', label: $localize`MRA e-Invoicing`, icon: 'receipt_long', iconColor: 'text-indigo-600', module: null, requiresTaxAuthority: true },
    { path: 'team', label: $localize`Team`, icon: 'people', iconColor: 'text-purple-600', module: null },
    { path: 'billing', label: $localize`Billing`, icon: 'payment', iconColor: 'text-yellow-600', module: null },
  ];

  // Filtered nav links based on active modules
  readonly navLinks = computed(() =>
    this.allNavLinks.filter((link) => {
      if (link.requiresTaxAuthority && !this.fiscalisation.overview()?.supported) return false;
      return link.module === null || this.activeModuleKeys().includes(link.module);
    }),
  );

  constructor() {
    // Only stores in a country with a tax-authority integration get the Tax Compliance page.
    effect(() => {
      const storeId = this.storeStore.selectedStore()?._id;
      if (storeId) this.fiscalisation.loadOverview(storeId).subscribe({ error: () => this.fiscalisation.overview.set(null) });
    });
  }
}
