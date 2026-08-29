import { Component, OnInit, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgProgressbar } from 'ngx-progressbar';
import { NgProgressRouter } from 'ngx-progressbar/router';
import { TrialWarningBannerComponent } from './shared/components/trial-warning-banner/trial-warning-banner.component';
import { SubscriptionExpiringBannerComponent } from './shared/components/subscription-expiring-banner/subscription-expiring-banner.component';
import { PwaInstallPromptComponent } from './shared/components/pwa-install-prompt/pwa-install-prompt.component';
import { PwaUpdateService } from './shared/services/pwa-update.service';
import { PwaInstallService } from './shared/services/pwa-install.service';
import { IncomingTableOrderAlertComponent } from './shared/components/incoming-table-order-alert/incoming-table-order-alert.component';
import { SocketService } from './shared/services/socket.service';
import { SessionStorageService } from './shared/services/session-storage.service';
import { StoreStore } from './shared/stores/store.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgProgressbar, NgProgressRouter, TrialWarningBannerComponent, SubscriptionExpiringBannerComponent, PwaInstallPromptComponent, IncomingTableOrderAlertComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'shopbot-back-office';

  private pwaUpdateService = inject(PwaUpdateService);
  private pwaInstallService = inject(PwaInstallService);
  private socketService = inject(SocketService);
  private sessionStorage = inject(SessionStorageService);
  private storeStore = inject(StoreStore);

  constructor() {
    // Connect from here — the only component mounted on EVERY route — rather
    // than from MenuComponent, which only renders at /menu/menu. Reloading
    // straight into any other route (e.g. /menu/pos/orders/list) previously
    // left the app with no socket at all, so table-order alerts never arrived
    // until the user happened to visit the module picker.
    //
    // StoreStore restores selectedStore from localStorage in its onInit hook,
    // so this resolves immediately on reload. connect() is idempotent and
    // no-ops when already connected to the same store.
    effect(() => {
      const storeId = this.storeStore.selectedStore()?._id;
      // The public storefront shares this AppComponent but has no staff
      // session; without a token the server would just disconnect us.
      const hasSession = !!this.sessionStorage.getAuthToken();
      if (storeId && hasSession) {
        this.socketService.connect(storeId);
      }
    });
  }

  ngOnInit(): void {
    this.pwaUpdateService.initialize();
    this.pwaInstallService.initialize();
  }
}

