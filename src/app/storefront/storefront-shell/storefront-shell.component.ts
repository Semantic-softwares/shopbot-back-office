import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorefrontStore } from '../data-access/storefront.store';
import { StorefrontSocketService } from '../data-access/storefront-socket.service';
import { ThemeHostComponent } from '../theme-engine/theme-host.component';
import { CartBadgeComponent } from '../components/cart-badge/cart-badge.component';
import { CartDrawerComponent } from '../components/cart-drawer/cart-drawer.component';
import { OrderConfirmationComponent } from '../components/order-confirmation/order-confirmation.component';
import { OrderStatusFabComponent } from '../components/order-status-fab/order-status-fab.component';
import { LoadingStateComponent } from '../components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../components/empty-state/empty-state.component';
import { LanguageSelectDialogComponent } from '../components/language-select-dialog/language-select-dialog.component';
import { STOREFRONT_LANG_STORAGE_KEY } from '../i18n/languages';

const THEME_CSS_VARS = ['--sf-accent', '--sf-text', '--sf-font-family'] as const;

// Resolves the URL (browse-only vs. table-scanned) into the StorefrontStore
// once, then just renders state — the theme, cart, and confirmation
// components below all read from that same store, never fetch on their own.
@Component({
  selector: 'app-storefront-shell',
  standalone: true,
  imports: [
    ThemeHostComponent,
    CartBadgeComponent,
    CartDrawerComponent,
    OrderConfirmationComponent,
    OrderStatusFabComponent,
    LoadingStateComponent,
    EmptyStateComponent,
  ],
  templateUrl: './storefront-shell.component.html',
})
export class StorefrontShellComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly socketService = inject(StorefrontSocketService);
  protected readonly store = inject(StorefrontStore);
  protected readonly isCartOpen = signal(false);
  private hasPromptedLanguage = false;
  // Last server name we announced, so re-emitted status updates (which arrive
  // on every order change) don't re-toast the same assignment repeatedly.
  private announcedServerName: string | null = null;

  constructor() {
    const qrToken = this.route.snapshot.paramMap.get('qrToken');
    const storeSlug = this.route.parent?.snapshot.paramMap.get('storeSlug') ?? this.route.snapshot.paramMap.get('storeSlug');

    if (qrToken) {
      this.store.resolveByQrToken(qrToken);
      // Live order status only makes sense once a table is actually resolved
      // (browse-only visits have no order to track).
      this.socketService.connectAndJoin(qrToken);
      this.socketService.orderStatus$.pipe(takeUntilDestroyed()).subscribe((status) => {
        this.store.setOrderStatus(status);
      });
    } else if (storeSlug) {
      this.store.resolveBySlug(storeSlug);
    }

    // Set on :root (not just this component's host) so MatDialog/MatBottomSheet
    // content — portaled to a CDK overlay attached directly to <body>, outside
    // this component's DOM subtree — still inherits the store's chosen colors.
    effect(() => {
      const settings = this.store.themeSettings();
      const root = document.documentElement.style;
      settings['accentColor'] ? root.setProperty('--sf-accent', settings['accentColor']) : root.removeProperty('--sf-accent');
      settings['primaryColor'] ? root.setProperty('--sf-text', settings['primaryColor']) : root.removeProperty('--sf-text');
      settings['fontFamily'] ? root.setProperty('--sf-font-family', settings['fontFamily']) : root.removeProperty('--sf-font-family');
    });

    // First-ever visit to the storefront (no stored language preference yet)
    // — ask once the page is actually showing something worth reading, not
    // over the loading spinner or an error state.
    effect(() => {
      if (this.store.storeInfo() && !this.hasPromptedLanguage) {
        this.hasPromptedLanguage = true;
        this.maybePromptForLanguage();
      }
    });

    // Reassure the guest the moment a server picks up their table. Status
    // updates re-emit on every order change, so this only announces when the
    // server's name actually changes (first assignment, or a handover).
    effect(() => {
      const serverName = this.store.orderStatus()?.assignedStaffName;
      if (serverName && serverName !== this.announcedServerName) {
        this.announcedServerName = serverName;
        this.snackBar.open(
          $localize`:@@storefront.orderStatus.acceptedToast:${serverName}:serverName: is taking care of your order`,
          undefined,
          { duration: 6000, horizontalPosition: 'center', verticalPosition: 'top' },
        );
      }
    });
  }

  private maybePromptForLanguage(): void {
    if (localStorage.getItem(STOREFRONT_LANG_STORAGE_KEY)) {
      return;
    }
    this.dialog.open(LanguageSelectDialogComponent, {
      width: '360px',
      disableClose: true,
      data: { dismissible: false },
    });
  }

  ngOnDestroy(): void {
    const root = document.documentElement.style;
    for (const prop of THEME_CSS_VARS) {
      root.removeProperty(prop);
    }
    this.socketService.disconnect();
  }
}
