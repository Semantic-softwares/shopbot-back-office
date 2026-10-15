import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToolbarComponent } from '../../shared/components/toolbar/toolbar.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { Store } from '../../shared/models';
import { AuthService } from '../../shared/services/auth.service';
import { RolesService } from '../../shared/services/roles.service';
import { StoreStore } from '../../shared/stores/store.store';
import { TrPipe } from '../../shared/i18n/tr.pipe';
import { PendingSalesStore } from '../../shared/stores/pending-sales.store';

@Component({
  selector: 'app-pos',
  imports: [TrPipe, 
    RouterModule,
    ToolbarComponent,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatMenuModule,
    MatExpansionModule,
    MatBadgeModule,
  ],
  templateUrl: './pos.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './pos.scss',
})
export class Pos {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);
  public storeStore = inject(StoreStore);
  public rolesService = inject(RolesService);
  private pendingSales = inject(PendingSalesStore);

  /** Phones only (under 768px) get the bottom navigation; tablets and up keep the side rail like desktop. */
  public isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 767.98px)').pipe(
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

  private navItemsConfig: { icon: string; label: string; link: string; badge?: boolean }[] = [
    {
      icon: 'point_of_sale',
      label: $localize`Checkout`,
      link: './checkout',
    },
    {
      icon: 'table_restaurant',
      label: $localize`Tables`,
      link: './tables',
    },
    {
      icon: 'receipt_long',
      label: $localize`Orders`,
      link: './orders',
    },
    {
      icon: 'pause_circle',
      label: $localize`Pending`,
      link: './pending',
      badge: true,
    },
  ];

  /** Number of sales set aside, shown as a badge on the Pending item. */
  public pendingCount = this.pendingSales.count;

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
