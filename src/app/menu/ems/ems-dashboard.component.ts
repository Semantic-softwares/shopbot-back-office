import { Component, inject, signal, computed } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToolbarComponent } from '../../shared/components/toolbar/toolbar.component';
import { RolesService } from '../../shared/services/roles.service';

@Component({
  selector: 'app-ems-dashboard',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterModule,
    MatDividerModule,
    MatTooltipModule,
    ToolbarComponent,
  ],
  templateUrl: './ems-dashboard.component.html',
  styleUrl: './ems-dashboard.component.scss',
})
export class EmsDashboardComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private rolesService = inject(RolesService);

  public isMobile = signal<boolean>(window.innerWidth < 768);
  public opened = signal<boolean>(true);

  private navItemsConfig = [
    {
      name: 'Dashboard',
      children: [
        {
          icon: 'dashboard',
          label: 'Overview',
          link: './overview',
          permissions: ['estate.properties.view'],
        },
      ],
    },
    {
      name: 'Property Management',
      children: [
        {
          icon: 'domain',
          label: 'Properties',
          link: './properties',
          permissions: ['estate.properties.view', 'estate.properties.create'],
        },
        {
          icon: 'person',
          label: 'Rental Owners',
          link: './properties/rental-owners',
          permissions: ['estate.properties.view', 'estate.properties.create'],
        },
        {
          icon: 'groups',
          label: 'Tenants',
          link: './properties/tenants',
          permissions: ['estate.properties.view', 'estate.properties.create'],
        },
      ],
    },
    {
      name: 'Lease Management',
      children: [
        {
          icon: 'description',
          label: 'Leases',
          link: './leases',
          permissions: ['estate.leases.view', 'estate.leases.create'],
        },
      ],
    },
    {
      name: 'Accounting',
      children: [
        {
          icon: 'receipt_long',
          label: 'Invoices',
          link: './accounting/invoices',
          permissions: ['estate.leases.view'],
        },
        {
          icon: 'payments',
          label: 'Payments',
          link: './accounting/payments',
          permissions: ['estate.leases.view'],
        },
        {
          icon: 'receipt',
          label: 'Receipts',
          link: './accounting/receipts',
          permissions: ['estate.leases.view'],
        },
        {
          icon: 'timeline',
          label: 'Ledger',
          link: './accounting/ledger',
          permissions: ['estate.leases.view'],
        },
      ],
    },
    {
      name: 'Arrears & Collections',
      children: [
        {
          icon: 'warning_amber',
          label: 'Arrears & Collections',
          link: './collections/arrears',
          permissions: ['estate.leases.view', 'estate.leases.create'],
        },
      ],
    },
    {
      name: 'Maintenance',
      children: [
        {
          icon: 'handyman',
          label: 'Maintenance Requests',
          link: './maintenance/maintenances',
          permissions: ['estate.properties.view', 'estate.units.view', 'estate.leases.view'],
        },
        {
          icon: 'engineering',
          label: 'Vendors',
          link: './maintenance/vendors',
          permissions: ['estate.properties.view', 'estate.units.view', 'estate.leases.view'],
        },
        {
          icon: 'category',
          label: 'Categories',
          link: './maintenance/categories',
          permissions: ['estate.properties.view', 'estate.units.view', 'estate.leases.view'],
        },
      ],
    }
  ];

  public navItems = computed(() => {
    return this.navItemsConfig
      .map((section) => ({
        ...section,
        children: section.children.filter((item) =>
          this.rolesService.hasAny(item.permissions),
        ),
      }))
      .filter((section) => section.children.length > 0);
  });

  public openLink(link: string): void {
    this.router.navigate([link], { relativeTo: this.route });
  }

  toggleSidenav(): void {
    this.opened.set(!this.opened());
  }

  public getFirstChildIcon(item: any): string {
    return item.children && item.children.length > 0
      ? item.children[0].icon
      : 'folder';
  }

  public isNavItemActive(item: any): boolean {
    if (!item.children || item.children.length === 0) return false;
    const currentUrl = this.router.url.split('?')[0].split('#')[0];
    return item.children.some((child: any) => {
      const resolved = this.router
        .createUrlTree([child.link], { relativeTo: this.route })
        .toString();
      return currentUrl.startsWith(resolved);
    });
  }

  public hasSingleChild(item: any): boolean {
    return item.children && item.children.length === 1;
  }

  public navigateToSingleChild(item: any): void {
    if (this.hasSingleChild(item)) {
      this.router.navigate([item.children[0].link], {
        relativeTo: this.route,
      });
      this.closeSidenavOnMobile();
    }
  }

  public closeSidenavOnMobile(): void {
    if (this.isMobile()) {
      this.opened.set(false);
    }
  }
}
