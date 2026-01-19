import { Component, inject, signal, computed } from '@angular/core';

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
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { StoreStore } from '../../shared/stores/store.store';
import { Store } from '../../shared/models';
import { ToolbarComponent } from '../../shared/components/toolbar/toolbar.component';
import { RolesService } from '../../shared/services/roles.service';

interface NavItem {
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
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterModule,
    MatExpansionModule,
    MatDividerModule,
    ToolbarComponent
],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  private router = inject(Router);
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
    ],
    'Employees': [
      'settings.staff.view',
      'settings.staff.create',
      'settings.staff.edit',
    ],
    'Customers': [
      'erp.products.view',
    ],
    'Settings': [
      'settings.store.view',
      'settings.store.edit',
    ],
  };

  private readonly allNavItems: NavSection[] = [
    {
      name: 'Reports',
      children: [
        {
          icon: 'leaderboard',
          label: 'Sales summary',
          link: './reports/summary',
          permission: 'view_company',
        },
        {
          icon: 'shop',
          label: 'Sales by item',
          link: './reports/sales-by-item',
          permission: 'view_timeline',
        },
        {
          icon: 'category',
          label: 'Sales by category',
          link: './reports/sales-by-category',
          permission: 'view_company',
        },
        {
          icon: 'diversity_1',
          label: 'Sales by employee',
          link: './reports/sales-by-employee',
          permission: 'manage_home',
        },
        {
          icon: 'payments',
          label: 'Sales by payment type',
          link: './reports/sales-by-payment-type',
          permission: 'manage_home',
        },
        {
          icon: 'description',
          label: 'Receipts',
          link: './reports/receipts',
          permission: 'manage_home',
        },
      ],
    },
    {
      name: 'Items',
      children: [
        {
          icon: 'local_mall',
          label: 'Products',
          link: './items/products',
          permission: 'view_company',
        },
        {
          icon: 'category_search',
          label: 'Categories',
          link: './items/categories',
          permission: 'view_timeline',
        },
        {
          icon: 'palette',
          label: 'Modifiers',
          link: './items/variants',
          permission: 'view_company',
        },
        {
          icon: 'check_box',
          label: 'Options',
          link: './items/options',
          permission: 'view_company',
        },
        {
          icon: 'restaurant',
          label: 'Stations',
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
          label: 'Tables',
          link: './tables/list',
          permission: 'view_company',
        },
        {
          icon: 'category',
          label: 'Table Categories',
          link: './tables/categories/list',
          permission: 'view_company',
        },
      ],
    },
    {
      name:  'Inventory',
      children: [
        { icon: 'warehouse', label: 'Suppliers', link: './inventory/suppliers', permission: 'view_company' },
        { icon: 'inventory_2', label: 'Restock', link: './inventory/restock', permission: 'view_company' },
        { icon: 'calculate', label: 'Reconciliations', link: './inventory/reconciliations', permission: 'view_company' },
      ]
    },
    {
      name: 'Employees',
      children: [
        {
          icon: 'assignment_ind',
          label: 'Employees',
          link: './employees/list',
          permission: 'view_company',
        },
        {
          icon: 'access_time',
          label: 'Timecards',
          link: './employees/timecards/list',
          permission: 'view_company',
        },
      ],
    },
    {
      name: 'Customers',
      children: [
        {
          icon: 'groups',
          label: 'Customers',
          link: './customers/list',
          permission: 'view_company',
        },
      ],
    },
    {
      name:  'Settings',
      children: [
        { icon: 'settings', label: 'Settings', link: './settings', permission: 'view_company' },
      ]
    },
  ];

  // Computed signal for filtered nav items based on permissions
  public navItems = computed(() => {
    if (this.rolesService.isAdmin()) {
      // Admin can see all items
      return this.allNavItems;
    }

    // Filter sections based on user permissions
    return this.allNavItems
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
}
