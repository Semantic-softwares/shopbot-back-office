import { Component, inject, OnInit, OnDestroy, effect, computed } from '@angular/core';

import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { ToolbarComponent } from '../shared/components/toolbar/toolbar.component';
import { SocketService } from '../shared/services/socket.service';
import { StoreStore } from '../shared/stores/store.store';
import { RolesService } from '../shared/services/roles.service';

@Component({
  selector: 'app-menu',
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    ToolbarComponent
],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private socketService = inject(SocketService);
  private storeStore = inject(StoreStore);
  private rolesService = inject(RolesService);

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

  // POS module permissions (requires at least one ERP permission)
  private readonly POS_PERMISSIONS = this.ERP_PERMISSIONS;

  // Menu visibility computed signals
  canAccessERP = computed(() => 
    this.rolesService.isAdmin() || this.rolesService.hasAny(this.ERP_PERMISSIONS)
  );

  canAccessHMS = computed(() =>
    this.rolesService.isAdmin() || this.rolesService.hasAny(this.HMS_PERMISSIONS)
  );

  canAccessPOS = computed(() =>
    this.rolesService.isAdmin() || this.rolesService.hasAny(this.POS_PERMISSIONS)
  );

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
    // Connect to socket on component init
    const storeId = this.storeStore.selectedStore()?._id;
    if (storeId) {
      this.socketService.connect(storeId);
      console.log('🔌 Socket connected on menu component init');
    }
  }

  ngOnDestroy() {
    // Disconnect socket when component is destroyed
    // this.socketService.disconnect();
    console.log('🔌 Socket disconnected on menu component destroy');
  }

  navigateToModule(moduleType: 'erp' | 'hotel' | 'pos'): void {
    if (moduleType === 'erp') {
      this.router.navigate(['/menu/erp']);
    } else if (moduleType === 'hotel') {
      this.router.navigate(['/menu/hms']);
    } else if (moduleType === 'pos') {
      this.router.navigate(['/menu/pos']);
    }
  }
}
