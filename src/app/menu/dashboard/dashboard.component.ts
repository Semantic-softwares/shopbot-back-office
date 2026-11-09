import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { StoreStore } from '../../shared/stores/store.store';
import { Store } from '../../shared/models';
import { ToolbarComponent } from '../../shared/components/toolbar/toolbar.component';
import { RolesService } from '../../shared/services/roles.service';
import { TrPipe } from '../../shared/i18n/tr.pipe';

import { BlinkContextService } from '../../shared/blink/blink-context.service';
import { RegisterContextService } from '../../shared/register/register-context.service';
import { FiscalisationService } from '../../shared/services/fiscalisation.service';

interface NavItem {
  /** Hidden unless the store's tax authority is switched on. */
  requiresFiscal?: boolean;
  /** Hidden unless register management is switched on for the store. */
  requiresRegisters?: boolean;
  /** Hidden unless Blink payments are switched on for the store (Mauritius stores only). */
  requiresBlink?: boolean;
  icon: string;
  label: string;
  link: string;
  permission: string;
}

interface NavSection {
  name: string;
  children: NavItem[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TrPipe, 
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterModule,
    MatExpansionModule,
    MatDividerModule,
    MatTooltipModule,
    ToolbarComponent
],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  private router = inject(Router);
  private fiscalisation = inject(FiscalisationService);
  private registerContext = inject(RegisterContextService);
  private blinkContext = inject(BlinkContextService);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private rolesService = inject(RolesService);
  public storeStore = inject(StoreStore);
  private breakpointObserver = inject(BreakpointObserver);
  private userToggledOpen = signal(false);

  public isMobile = toSignal(
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small]).pipe(
      map(result => result.matches)
    ),
    { initialValue: false }
  );

  public opened = computed(() =>
    this.isMobile() ? this.userToggledOpen() : true
  );

  public currentUser = toSignal(this.authService.currentUser, {
    initialValue: null,
  });

  hasAllRequiredPermissions = this.authService.hasAnyPermission([
    'manage_users',
    'manage_events',
    'manage_companies',
    'manage_dashboard',
    'manage_settings',
  ]);

  // Map of section names to their required permissions
  private readonly sectionPermissions: Record<string, string[]> = {
    'Dashboard': [
      'erp.orders.view',
      'erp.products.view',
      'finance.reports.view',
      'finance.transactions.view',
    ],
    'Reports': [
      'erp.orders.view',
      'erp.products.view',
      'finance.reports.view',
      'finance.transactions.view',
    ],
    'Items': [
      'erp.products.view',
      'erp.products.create',
      'erp.products.edit',
    ],
    'Tables': [
      'erp.products.view',
      'erp.products.edit',
    ],
    'Inventory': [
      'erp.inventory.view',
      'erp.inventory.create',
      'erp.inventory.edit',
      'erp.suppliers.view',
      'erp.purchasing.view',
    ],
    'Customers': [
      'erp.products.view',
    ],
    'Sales': [
      'pos.register.view',
      'pos.register.view_reports',
      'pos.register.manage',
      'pos.register.reconcile',
    ],
    'Accounting': [
      'erp.accounting.view',
      'erp.accounting.manage',
    ],
    'Settings': [
      'settings.store.view',
      'settings.store.edit',
    ],
  };

  private readonly allNavItems: NavSection[] = [
    {
      name: 'Dashboard',
      children: [
        {
          icon: 'space_dashboard',
          label: $localize`Dashboard`,
          link: './dashboard',
          permission: 'view_company',
        },
      ],
    },
    {
      name: 'Reports',
      children: [
        {
          icon: 'leaderboard',
          label: $localize`Sales summary`,
          link: './reports/summary',
          permission: 'view_company',
        },
        {
          icon: 'shop',
          label: $localize`Sales by item`,
          link: './reports/sales-by-item',
          permission: 'view_timeline',
        },
        {
          icon: 'category',
          label: $localize`Sales by category`,
          link: './reports/sales-by-category',
          permission: 'view_company',
        },
        {
          icon: 'diversity_1',
          label: $localize`Sales by employee`,
          link: './reports/sales-by-employee',
          permission: 'manage_home',
        },
        {
          icon: 'payments',
          label: $localize`Sales by payment type`,
          link: './reports/sales-by-payment-type',
          permission: 'manage_home',
        },
        {
          icon: 'description',
          label: $localize`Receipts`,
          link: './reports/receipts',
          permission: 'manage_home',
        },
        {
          icon: 'bolt',
          label: $localize`Blink payments`,
          link: './reports/blink-payments',
          permission: 'manage_home',
          requiresBlink: true,
        },
        {
          icon: 'receipt_long',
          label: $localize`Fiscal transactions`,
          link: './reports/fiscal-transactions',
          permission: 'manage_home',
          requiresFiscal: true,
        },
        {
          icon: 'summarize',
          label: $localize`Tax Report`,
          link: './reports/tax-report',
          permission: 'view_company',
        },
      ],
    },
    {
      name: 'Items',
      children: [
        {
          icon: 'local_mall',
          label: $localize`Products`,
          link: './items/products',
          permission: 'view_company',
        },
        {
          icon: 'category_search',
          label: $localize`Categories`,
          link: './items/categories',
          permission: 'view_timeline',
        },
        {
          icon: 'palette',
          label: $localize`Modifiers`,
          link: './items/variants',
          permission: 'view_company',
        },
        {
          icon: 'check_box',
          label: $localize`Options`,
          link: './items/options',
          permission: 'view_company',
        },
        {
          icon: 'restaurant',
          label: $localize`Stations`,
          link: './items/stations',
          permission: 'view_company',
        },
      ],
    },
    {
      name: 'Tables',
      children: [
        {
          icon: 'table_restaurant',
          label: $localize`Tables`,
          link: './tables/list',
          permission: 'view_company',
        },
        {
          icon: 'category',
          label: $localize`Table Categories`,
          link: './tables/categories/list',
          permission: 'view_company',
        },
      ],
    },
    {
      name:  'Inventory',
      children: [
        { icon: 'warehouse', label: $localize`Suppliers`, link: './inventory/suppliers', permission: 'view_company' },
        { icon: 'shopping_bag', label: $localize`Purchase orders`, link: './inventory/purchasing', permission: 'view_company' },
        { icon: 'inventory_2', label: $localize`Quick stock-in`, link: './inventory/restock', permission: 'view_company' },
        { icon: 'calculate', label: $localize`Reconciliations`, link: './inventory/reconciliations', permission: 'view_company' },
      ]
    },
    {
      name: 'Sales',
      children: [
        { icon: 'point_of_sale', label: $localize`Register sessions`, link: './sales/sessions', permission: 'view_company', requiresRegisters: true },
        { icon: 'swap_vert', label: $localize`Cash movements`, link: './sales/movements', permission: 'view_company', requiresRegisters: true },
        { icon: 'balance', label: $localize`Cash reconciliation`, link: './sales/reconciliation', permission: 'view_company', requiresRegisters: true },
        { icon: 'assessment', label: $localize`Register reports`, link: './sales/reports', permission: 'view_company', requiresRegisters: true },
      ],
    },
    {
      name: 'Accounting',
      children: [
        { icon: 'percent', label: $localize`Tax Management`, link: './accounting/tax-management', permission: 'view_company' },
      ],
    },
    {
      name: 'Customers',
      children: [
        {
          icon: 'groups',
          label: $localize`Customers`,
          link: './customers/list',
          permission: 'view_company',
        },
      ],
    },
    
  ];

  // Computed signal for filtered nav items based on permissions
  public navItems = computed(() => {
    // A fiscal entry only appears for a store whose tax authority is switched on, whoever is looking.
    const fiscalOn = this.fiscalisation.active();
    const registersOn = this.registerContext.enabled();
    const blinkOn = this.blinkContext.enabled();
    const offered = this.allNavItems
      .map((section) => ({ ...section, children: section.children.filter((item) => (!item.requiresFiscal || fiscalOn) && (!item.requiresRegisters || registersOn) && (!item.requiresBlink || blinkOn)) }));

    if (this.rolesService.isAdmin()) {
      // Admin can see all items
      return offered;
    }

    // Filter sections based on user permissions
    return offered
      .map(section => ({
        ...section,
        children: section.children.filter(item => 
          this.canAccessMenuItem(item)
        ),
      }))
      .filter(section => section.children.length > 0); // Only show sections with visible items
  });

  /**
   * Check if user has permission to access a menu item
   */
  private canAccessMenuItem(item: NavItem): boolean {
    // Check if user has any permission from the section's required permissions
    const sectionName = this.allNavItems.find(s => 
      s.children.some(child => child.link === item.link)
    )?.name;

    if (!sectionName) {
      return false;
    }

    const requiredPermissions = this.sectionPermissions[sectionName] || [];
    
    // Admin can see everything
    if (this.rolesService.isAdmin()) {
      return true;
    }

    // User must have at least one permission from the section
    return this.rolesService.hasAny(requiredPermissions);
  }

  public openLink(link: string): void {
    this.router.navigate([link], { relativeTo: this.route });
  }

  toggleSidenav() {
    this.userToggledOpen.update(value => !value);
  }

  goToProfile() {
    this.router.navigate(['dashboard', 'general', 'profile']);
  }

  public selectStore(store: Store) {
    console.log('Selected store:', store);
    this.storeStore.setSelectedStore(store);
    window.location.reload();
  }

  /**
   * Check if a nav section has only one child
   */
  public hasSingleChild(item: NavSection): boolean {
    return item.children?.length === 1;
  }

  /**
   * Get the first child's icon for the sidebar icon
   */
  public getFirstChildIcon(item: NavSection): string {
    return item.children?.[0]?.icon || 'folder';
  }

  /**
   * Check if any child of a nav item matches the active route.
   * Uses createUrlTree to resolve relative links and startsWith
   * to support deep nested routes.
   */
  public isNavItemActive(item: NavSection): boolean {
    if (!item.children || item.children.length === 0) {
      return false;
    }
    const currentUrl = this.router.url.split('?')[0].split('#')[0];
    return item.children.some((child) => {
      const resolved = this.router.createUrlTree(
        [child.link],
        { relativeTo: this.route }
      ).toString();
      return currentUrl.startsWith(resolved);
    });
  }

  /**
   * Close sidenav on mobile after navigation
   */
  public closeSidenavOnMobile(): void {
    if (this.isMobile()) {
      this.userToggledOpen.set(false);
    }
  }
}
