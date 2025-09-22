import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatDividerModule } from '@angular/material/divider';
import { StoreStore } from '../../shared/stores/store.store';
import { Store } from '../../shared/models';
import { ToolbarComponent } from '../../shared/components/toolbar/toolbar.component';
import { UsageIndicatorComponent } from "../../shared/components/usage-indicator/usage-indicator.component";

@Component({
  selector: 'app-hms-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterModule,
    MatExpansionModule,
    MatDividerModule,
    ToolbarComponent,
    UsageIndicatorComponent
],
  templateUrl: './hms-dashboard.component.html',
  styleUrls: ['./hms-dashboard.component.scss'],
})
export class HmsDashboardComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  public storeStore = inject(StoreStore);
  public isMobile = signal(window.innerWidth < 768);
  public opened = signal(true);
  public currentUser = toSignal(this.authService.currentUser, {
    initialValue: null,
  });

  public navItems = [
    {
      name: 'Dashboard',
      children: [
        {
          icon: 'dashboard',
          label: 'Overview',
          link: './overview',
          permission: 'view_hotel_dashboard',
        },
        {
          icon: 'analytics',
          label: 'Analytics',
          link: './analytics',
          permission: 'view_hotel_analytics',
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
          permission: 'manage_reservations',
        },
        {
          icon: 'check_in',
          label: 'Check-In / Check-Out',
          link: './front-desk/check-in-check-out',
          permission: 'manage_checkin',
        },
        {
          icon: 'people',
          label: 'Guests',
          link: './front-desk/guests',
          permission: 'manage_guests',
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
          permission: 'manage_rooms',
        },
        {
          icon: 'category',
          label: 'Room Types',
          link: './rooms-management/room-types',
          permission: 'manage_room_types',
        },
        // {
        //   icon: 'cleaning_services',
        //   label: 'Housekeeping',
        //   link: './housekeeping',
        //   permission: 'manage_housekeeping',
        // },
      ],
    },
    {
      name: 'Reports',
      children: [
        {
          icon: 'assessment',
          label: 'Occupancy Report',
          link: './reports/occupancy',
          permission: 'view_reports',
        },
        {
          icon: 'monetization_on',
          label: 'Revenue Report',
          link: './reports/revenue',
          permission: 'view_reports',
        },
        {
          icon: 'people_outline',
          label: 'Guest Report',
          link: './reports/guest',
          permission: 'view_reports',
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
          permission: 'manage_hotel_settings',
        },
        {
          icon: 'attach_money',
          label: 'Pricing',
          link: './pricing',
          permission: 'manage_pricing',
        },
      ],
    },
  ];

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