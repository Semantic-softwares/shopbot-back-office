import { Component, inject, OnInit, OnDestroy, effect } from '@angular/core';

import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ToolbarComponent } from '../shared/components/toolbar/toolbar.component';
import { SocketService } from '../shared/services/socket.service';
import { StoreStore } from '../shared/stores/store.store';

@Component({
  selector: 'app-menu',
  imports: [
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
