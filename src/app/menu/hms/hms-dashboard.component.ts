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
}