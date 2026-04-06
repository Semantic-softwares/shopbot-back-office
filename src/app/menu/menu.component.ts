import { Component, inject, OnInit, OnDestroy, effect, computed, signal } from '@angular/core';

import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { catchError, of, switchMap } from 'rxjs';
import { ToolbarComponent } from '../shared/components/toolbar/toolbar.component';
import { SocketService } from '../shared/services/socket.service';
import { StoreStore } from '../shared/stores/store.store';
import { RolesService } from '../shared/services/roles.service';
import { SubscriptionService } from '../shared/services/subscription.service';
import { ModuleKey, SubscriptionWithModules } from '../shared/models';

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
  styleUrl: './menu.component.scss',
})
export class MenuComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private socketService = inject(SocketService);
  private storeStore = inject(StoreStore);
  private rolesService = inject(RolesService);
  private subscriptionService = inject(SubscriptionService);
  private snackBar = inject(MatSnackBar);

  readonly subscriptionLoading = signal(true);
  readonly addingModule = signal<ModuleKey | null>(null);
  private readonly subscriptionDetails = signal<SubscriptionWithModules | null>(null);

  /** All possible modules with their display config */
  readonly ALL_MODULE_DEFS: Array<{
    key: ModuleKey;
    label: string;
    description: string;
    icon: string;
    monthly: number;
    yearly: number;
    color: string;
  }> = [
    {
      key: 'PMS',
      label: 'Hotel Management',
      description: 'Reservations, rooms, housekeeping & guest services',
      icon: 'hotel',
      monthly: 100,
      yearly: 1000,
      color: 'text-blue-600',
    },
    {
      key: 'EMS',
      label: 'Estate Management',
      description: 'Properties, units, tenants & invoicing',
      icon: 'domain',
      monthly: 100,
      yearly: 1000,
      color: 'text-emerald-600',
    },
    {
      key: 'POS',
      label: 'Point of Sale',
      description: 'Sales, transactions & customer orders',
      icon: 'point_of_sale',
      monthly: 0,
      yearly: 0,
      color: 'text-orange-600',
    },
    {
      key: 'ERP',
      label: 'Enterprise Resource Planning',
      description: 'Inventory, orders, suppliers & stock management',
      icon: 'business',
      monthly: 0,
      yearly: 0,
      color: 'text-purple-600',
    },
  ];

  /** Modules the store currently has active in subscription */
  private readonly activeSubscribedKeys = computed<ModuleKey[]>(() => {
    const details = this.subscriptionDetails();
    if (!details) return [];
    return details.modules
      .filter((m) => m.status === 'ACTIVE')
      .map((m) => m.moduleKey);
  });

  /** Modules not yet in subscription — shown in "Add Modules" section */
  readonly availableToAdd = computed(() =>
    this.ALL_MODULE_DEFS.filter(
      (def) => !this.activeSubscribedKeys().includes(def.key),
    ),
  );

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
      .subscribe((subscriptionDetails) => {
        this.subscriptionDetails.set(subscriptionDetails);
        this.subscriptionLoading.set(false);
      });
  }

  ngOnDestroy() {
    // Socket listeners are now managed by SocketService - no cleanup needed here
  }

  addModule(key: ModuleKey): void {
    if (this.addingModule()) return;
    this.addingModule.set(key);

    this.subscriptionService.addModule(key).pipe(
      switchMap(() => this.subscriptionService.getSubscriptionWithModules()),
      catchError((err) => {
        this.snackBar.open(
          err?.error?.message ?? `Failed to add module ${key}`,
          'Close',
          { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' },
        );
        return of(null);
      }),
    ).subscribe((details) => {
      this.addingModule.set(null);
      if (details) {
        this.subscriptionDetails.set(details);
        const def = this.ALL_MODULE_DEFS.find((d) => d.key === key);
        this.snackBar.open(
          `${def?.label ?? key} added to your subscription`,
          'Close',
          { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' },
        );
      }
    });
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
