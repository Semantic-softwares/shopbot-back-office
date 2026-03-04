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
import { MatTooltipModule } from '@angular/material/tooltip';
import { StoreStore } from '../../shared/stores/store.store';
import { Store } from '../../shared/models';
import { ToolbarComponent } from '../../shared/components/toolbar/toolbar.component';
import { RolesService } from '../../shared/services/roles.service';

@Component({
  selector: 'app-hms-dashboard',
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
    MatTooltipModule,
    ToolbarComponent
],
  templateUrl: './hms-dashboard.component.html',
  styleUrls: ['./hms-dashboard.component.scss'],
})
export class HmsDashboardComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  public storeStore = inject(StoreStore);
  public rolesService = inject(RolesService);
  public isMobile = signal(window.innerWidth < 768);
  public opened = signal(true);
  public currentUser = toSignal(this.authService.currentUser, {
    initialValue: null,
  });

  private navItemsConfig = [
    {
      name: 'Dashboard',
      children: [
        {
          icon: 'dashboard',
          label: 'Overview',
          link: './overview',
          permissions: ['hotel.reservations.view', 'hotel.rooms.view'],
        },
      ],
    },
    {
      name: 'Front Desk',
      children: [
        {
          icon: 'book_online',
          label: 'Reservations',
          link: './front-desk/reservations',
          permissions: ['hotel.reservations.view', 'hotel.reservations.create'],
        },
        {
          icon: 'check_in',
          label: 'Check-In / Check-Out',
          link: './front-desk/check-in-check-out',
          permissions: ['hotel.reservations.checkin', 'hotel.reservations.checkout'],
        },
        {
          icon: 'people',
          label: 'Guests',
          link: './front-desk/guests',
          permissions: ['hotel.guests.view', 'hotel.guests.create'],
        },
      ],
    },
       {
      name: 'Channel Management',
      children: [
        {
          icon: 'sync_alt',
          label: 'Mappings',
          link: './channel-management/mappings',
          permissions: ['hotel.guests.view', 'hotel.guests.create'],
        },
        {
          icon: 'rate_review',
          label: 'Inventory & Rates',
          link: './channel-management/inventory-rates',
          permissions: ['hotel.reservations.view', 'hotel.reservations.create'],
        },
        {
          icon: 'tv_options_input_settings',
          label: 'Settings',
          link: './channel-management/settings',
          permissions: ['hotel.reservations.checkin', 'hotel.reservations.checkout'],
        },
        {
          icon: 'live_tv',
          label: 'Live Booking',
          link: './channel-management/live-booking',
          permissions: ['hotel.guests.view', 'hotel.guests.create'],
        },
        {
          icon: 'mail',
          label: 'Messages',
          link: './channel-management/messaging',
          permissions: ['hotel.guests.view', 'hotel.guests.create'],
        },
      ],
    },
    {
      name: 'Room Management',
      children: [
        {
          icon: 'hotel',
          label: 'Rooms',
          link: './rooms-management/rooms',
          permissions: ['hotel.rooms.view', 'hotel.rooms.create', 'hotel.rooms.edit'],
        },
        {
          icon: 'category',
          label: 'Room Types',
          link: './rooms-management/room-types',
          permissions: ['hotel.roomtypes.view', 'hotel.roomtypes.create'],
        },
        {
          icon: 'price_change',
          label: 'Rate Plans',
          link: './rooms-management/rate-plans',
          permissions: ['hotel.rooms.view', 'hotel.rooms.edit'],
        },
        {
          icon: 'calendar_month',
          label: 'Inventory Calendar',
          link: './rooms-management/inventory',
          permissions: ['hotel.rooms.view', 'hotel.rooms.edit'],
        },
      ],
    },
    {
      name: 'Reports',
      children: [
        {
          icon: 'assessment',
          label: 'Occupancy Report',
          link: './reports/occupancy',
          permissions: ['finance.reports.view'],
        },
        {
          icon: 'monetization_on',
          label: 'Revenue Report',
          link: './reports/revenue',
          permissions: ['finance.reports.view', 'finance.transactions.view'],
        },
        {
          icon: 'people_outline',
          label: 'Guest Report',
          link: './reports/guest',
          permissions: ['finance.reports.view'],
        },
      ],
    },
    {
      name: 'Settings',
      children: [
        {
          icon: 'settings',
          label: 'Hotel Settings',
          link: './settings/hotel-settings',
          permissions: ['settings.store.view', 'settings.store.edit', 'settings.staff.view', 'settings.roles.view'],
        },
      ],
    },
  ];

  // Computed nav items that filters based on user permissions
  public navItems = computed(() => {
    // Filter nav items based on permissions
    return this.navItemsConfig
      .map(section => ({
        ...section,
        children: section.children.filter(item => 
          this.rolesService.hasAny(item.permissions)
        )
      }))
      .filter(section => section.children.length > 0);
  });

  public openLink(link: string): void {
    this.router.navigate([link], { relativeTo: this.route });
  }

  toggleSidenav() {
    this.opened.set(!this.opened());
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
   * Get the first child icon for a nav item (for display on icon-based nav)
   */
  public getFirstChildIcon(item: any): string {
    return item.children && item.children.length > 0 ? item.children[0].icon : 'folder';
  }

  /**
   * Check if any child of a nav item is on the active route.
   * Resolves relative links (e.g. "./front-desk/reservations") against
   * the activated route so deep nested paths still match.
   */
  public isNavItemActive(item: any): boolean {
    if (!item.children || item.children.length === 0) {
      return false;
    }
    const currentUrl = this.router.url.split('?')[0].split('#')[0];
    return item.children.some((child: any) => {
      // Resolve the relative link to an absolute path
      const resolved = this.router.createUrlTree(
        [child.link],
        { relativeTo: this.route }
      ).toString();
      return currentUrl.startsWith(resolved);
    });
  }

  /**
   * Check if a nav item has only one child
   */
  public hasSingleChild(item: any): boolean {
    return item.children && item.children.length === 1;
  }

  /**
   * Navigate to the first (and only) child of a nav item
   */
  public navigateToSingleChild(item: any): void {
    if (this.hasSingleChild(item)) {
      this.router.navigate([item.children[0].link], { relativeTo: this.route });
      this.closeSidenavOnMobile();
    }
  }

  /**
   * Close sidenav on mobile after navigation
   */
  public closeSidenavOnMobile(): void {
    if (this.isMobile()) {
      this.opened.set(false);
    }
  }

  /**
   * Logout the user
   */
  public logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}