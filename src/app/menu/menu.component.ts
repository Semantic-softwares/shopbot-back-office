import { Component, inject, OnInit, OnDestroy, effect, computed, signal, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { catchError, of, switchMap } from 'rxjs';
import { ToolbarComponent } from '../shared/components/toolbar/toolbar.component';
import { SocketService } from '../shared/services/socket.service';
import { StoreStore } from '../shared/stores/store.store';
import { RolesService } from '../shared/services/roles.service';
import { SubscriptionService } from '../shared/services/subscription.service';
import { ModuleKey } from '../shared/models';

@Component({
  selector: 'app-menu',
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ToolbarComponent,
  ],
  templateUrl: './menu.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './menu.component.scss',
})
export class MenuComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private socketService = inject(SocketService);
  private storeStore = inject(StoreStore);
  private rolesService = inject(RolesService);
  private subscriptionService = inject(SubscriptionService);

  readonly subscriptionLoading = signal(true);
  private readonly subscriptionDetails = this.subscriptionService.subscriptionWithModules;

  /** Modules the store currently has active in subscription */
  private readonly activeSubscribedKeys = this.subscriptionService.activeModuleKeys;

  // ERP module permissions
  private readonly ERP_PERMISSIONS = [
    'erp.inventory.view',
    'erp.inventory.create',
    'erp.inventory.edit',
    'erp.inventory.delete',
    'erp.inventory.adjust',
    'erp.products.view',
    'erp.products.create',
    'erp.products.edit',
    'erp.products.delete',
    'erp.orders.view',
    'erp.orders.create',
    'erp.orders.edit',
    'erp.orders.cancel',
    'erp.orders.refund',
    'erp.suppliers.view',
    'erp.suppliers.create',
    'erp.suppliers.edit',
    'erp.suppliers.delete',
  ];

  // HMS (Hotel Management System) module permissions
  private readonly HMS_PERMISSIONS = [
    'hotel.reservations.view',
    'hotel.reservations.create',
    'hotel.reservations.edit',
    'hotel.reservations.delete',
    'hotel.reservations.checkin',
    'hotel.reservations.checkout',
    'hotel.reservations.export',
    'hotel.rooms.view',
    'hotel.rooms.create',
    'hotel.rooms.edit',
    'hotel.rooms.delete',
    'hotel.rooms.status',
    'hotel.roomtypes.view',
    'hotel.roomtypes.create',
    'hotel.roomtypes.edit',
    'hotel.roomtypes.delete',
    'hotel.guests.view',
    'hotel.guests.create',
    'hotel.guests.edit',
    'hotel.guests.delete',
    'hotel.housekeeping.view',
    'hotel.housekeeping.manage',
    'hotel.housekeeping.complete',
  ];

  // EMS (Estate Management System) module permissions
  private readonly EMS_PERMISSIONS = [
    'estate.properties.view',
    'estate.properties.create',
    'estate.properties.edit',
    'estate.properties.delete',
    'estate.units.view',
    'estate.units.create',
    'estate.units.edit',
    'estate.units.delete',
  ];

  // POS module permissions
  private readonly POS_PERMISSIONS = [
    'pos.sales.view',
    'pos.sales.create',
    'pos.sales.edit',
    'pos.sales.void',
    'pos.sales.refund',
    'pos.sales.discount',
    'pos.tables.view',
    'pos.tables.manage',
    'pos.tables.create',
    'pos.tables.edit',
    'pos.tables.delete',
    'pos.checkout.process',
    'pos.checkout.split',
    'pos.kitchen.view',
    'pos.kitchen.manage',
    'pos.printing.receipt',
    'pos.printing.kitchen',
    'pos.printing.manage',
  ];

  // Menu visibility computed signals
  private hasSubscribedModule(moduleKey: ModuleKey): boolean {
    return this.activeSubscribedKeys().includes(moduleKey);
  }

  canAccessERP = computed(() => 
    this.hasSubscribedModule('ERP') &&
    (this.rolesService.isAdmin() || this.rolesService.hasAny(this.ERP_PERMISSIONS))
  );

  canAccessHMS = computed(() =>
    this.hasSubscribedModule('PMS') &&
    (this.rolesService.isAdmin() || this.rolesService.hasAny(this.HMS_PERMISSIONS))
  );

  canAccessPOS = computed(() =>
    this.hasSubscribedModule('POS') &&
    (this.rolesService.isAdmin() || this.rolesService.hasAny(this.POS_PERMISSIONS))
  );

  canAccessEMS = computed(() =>
    this.hasSubscribedModule('EMS') &&
    (this.rolesService.isAdmin() || this.rolesService.hasAny(this.EMS_PERMISSIONS))
  );

  // Only super admins can access administrative settings
  canAccessAdmin = computed(() => this.rolesService.isAdmin());

  /**
   * The actual product modules (not Administrative Settings, which is an
   * admin panel rather than something the store subscribes to) this user
   * can open right now. Used to skip the picker entirely when there's only
   * one real choice to make.
   */
  private readonly accessibleModuleRoutes = computed(() => {
    const routes: string[] = [];
    if (this.canAccessERP()) routes.push('/menu/erp');
    if (this.canAccessHMS()) routes.push('/menu/hms');
    if (this.canAccessPOS()) routes.push('/menu/pos');
    if (this.canAccessEMS()) routes.push('/menu/ems');
    return routes;
  });

  constructor() {
    // Connect socket when store changes (only if not already connected)
    effect(() => {
      const store = this.storeStore.selectedStore();
      if (store?._id && !this.socketService.isConnected()) {
        this.socketService.connect(store._id);
        console.log('🔌 Socket connected for store:', store.name);
      }
    });
  }

  ngOnInit() {
    const storeId = this.storeStore.selectedStore()?._id;

    if (storeId && !this.socketService.isConnected()) {
      this.socketService.connect(storeId);
    }

    this.subscriptionLoading.set(true);

    this.subscriptionService
      .getSubscriptionWithModules()
      .pipe(
        catchError((error) => {
          if (error?.status === 404) {
            return this.subscriptionService.createTrial().pipe(
              switchMap(() => this.subscriptionService.getSubscriptionWithModules()),
              catchError(() => of(null)),
            );
          }
          return of(null);
        }),
      )
      .subscribe(() => {
        this.subscriptionLoading.set(false);

        // Nothing to pick between — skip the module picker and go straight
        // to the one module this user can actually open. replaceUrl so the
        // picker never sits in browser history to land on via "back".
        const routes = this.accessibleModuleRoutes();
        if (routes.length === 1) {
          this.router.navigate([routes[0]], { replaceUrl: true });
        }
      });
  }

  ngOnDestroy() {
    // Socket listeners are now managed by SocketService - no cleanup needed here
  }

  navigateToModule(moduleType: 'erp' | 'hotel' | 'pos' | 'ems' | 'admin'): void {
    if (moduleType === 'erp') {
      this.router.navigate(['/menu/erp']);
    } else if (moduleType === 'hotel') {
      this.router.navigate(['/menu/hms']);
    } else if (moduleType === 'pos') {
      this.router.navigate(['/menu/pos']);
    } else if (moduleType === 'ems') {
      this.router.navigate(['/menu/ems']);
    } else if (moduleType === 'admin') {
      this.router.navigate(['/menu/admin']);
    }
  }
}
