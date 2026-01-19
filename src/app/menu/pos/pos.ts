import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToolbarComponent } from '../../shared/components/toolbar/toolbar.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { Store } from '../../shared/models';
import { AuthService } from '../../shared/services/auth.service';
import { RolesService } from '../../shared/services/roles.service';
import { StoreStore } from '../../shared/stores/store.store';

@Component({
  selector: 'app-pos',
  imports: [
    RouterModule,
    ToolbarComponent,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatMenuModule,
    MatExpansionModule,
  ],
  templateUrl: './pos.html',
  styleUrl: './pos.scss',
})
export class Pos {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);
  public storeStore = inject(StoreStore);
  public rolesService = inject(RolesService);

  public isMobile = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.Small, Breakpoints.Medium, Breakpoints.Tablet]).pipe(
      map(result => result.matches)
    ),
    { initialValue: false }
  );

  public opened = computed(() =>
    !this.isMobile()
  );

  public currentUser = toSignal(this.authService.currentUser, {
    initialValue: null,
  });

  private navItemsConfig = [
    {
      icon: 'point_of_sale',
      label: 'Checkout',
      link: './checkout',
    },
    {
      icon: 'table_restaurant',
      label: 'Tables',
      link: './tables',
    },
    {
      icon: 'receipt_long',
      label: 'Orders',
      link: './orders',
    },
  ];

  // Nav items for the sidebar
  public navItems = computed(() => this.navItemsConfig);

  public openLink(link: string): void {
    this.router.navigate([link], { relativeTo: this.route });
  }

  toggleSidenav() {
    // Sidebar is not toggleable on mobile/tablet - only visible on desktop
  }

  goToProfile() {
    this.router.navigate(['dashboard', 'general', 'profile']);
  }

  public selectStore(store: Store) {
    this.storeStore.setSelectedStore(store);
    window.location.reload();
  }
}
