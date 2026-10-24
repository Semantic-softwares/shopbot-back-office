import { BreakpointObserver } from '@angular/cdk/layout';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, filter, map, of } from 'rxjs';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { PlatformBillingService } from '../../shared/services/platform-billing.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  badge?: () => number;
}

/**
 * The super-admin area: its own shell, so it is obvious you are managing the platform and not a store. Every page in it calls the
 * server, which re-checks on each request that you are a platform admin.
 */
@Component({
  selector: 'app-super-admin-shell',
  imports: [NgTemplateOutlet, RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex min-h-screen bg-surface text-on-surface">
      @if (!compact()) {
        <aside class="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-outline-variant bg-surface-container-low">
          <ng-container [ngTemplateOutlet]="nav" />
        </aside>
      } @else if (open()) {
        <div class="fixed inset-0 z-40 bg-black/40" (click)="open.set(false)"></div>
        <aside class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-outline-variant bg-surface-container-low">
          <ng-container [ngTemplateOutlet]="nav" />
        </aside>
      }

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-outline-variant bg-surface px-3 sm:px-5">
          @if (compact()) {
            <button mat-icon-button (click)="open.set(true)" aria-label="Open menu" i18n-aria-label data-testid="admin-menu"><mat-icon>menu</mat-icon></button>
          }
          <span class="text-xs font-semibold uppercase tracking-wider text-primary" i18n>Administration</span>
          <span class="flex-1"></span>
          <app-theme-toggle />
          <a mat-stroked-button routerLink="/menu" class="!ml-2"><mat-icon>arrow_back</mat-icon><span class="max-sm:hidden" i18n>Back to the app</span></a>
        </header>
        <main class="min-w-0 flex-1 p-3 sm:p-6"><router-outlet /></main>
      </div>
    </div>

    <ng-template #nav>
      <div class="flex items-center gap-2 px-5 py-4">
        <mat-icon class="text-primary">admin_panel_settings</mat-icon>
        <div class="leading-tight"><div class="text-base font-semibold" i18n>Shopbot</div><div class="text-xs text-on-surface-variant" i18n>Platform administration</div></div>
      </div>
      <nav class="flex-1 overflow-y-auto px-3 pb-4" aria-label="Administration">
        @for (group of groups; track group.title) {
          <div class="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{{ group.title }}</div>
          @for (item of group.items; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="!bg-secondary-container !text-on-secondary-container" (click)="open.set(false)"
               class="flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium text-on-surface-variant no-underline hover:bg-surface-container-high" [attr.data-testid]="'nav-' + item.path">
              <mat-icon class="!h-5 !w-5 !text-xl !leading-none">{{ item.icon }}</mat-icon>
              <span class="flex-1">{{ item.label }}</span>
              @if (item.badge && item.badge() > 0) { <span class="rounded-full bg-primary px-2 text-xs font-semibold text-on-primary">{{ item.badge!() }}</span> }
            </a>
          }
        }
      </nav>
    </ng-template>
  `,
})
export class SuperAdminShellComponent {
  private readonly api = inject(PlatformBillingService);
  private readonly router = inject(Router);
  readonly open = signal(false);
  readonly compact = toSignal(inject(BreakpointObserver).observe('(max-width: 1023px)').pipe(map((s) => s.matches)), { initialValue: false });

  /** Open plan requests, for the badge. Reloaded after every navigation so resolving one updates it. */
  private readonly nav$ = toSignal(this.router.events.pipe(filter((e) => e instanceof NavigationEnd)), { initialValue: null });
  private readonly requests = rxResource({
    params: () => this.nav$(),
    stream: () => this.api.adminRequests('OPEN').pipe(catchError(() => of([]))),
  });
  readonly requestCount = computed(() => (this.requests.hasValue() ? this.requests.value().length : 0));

  readonly groups: Array<{ title: string; items: NavItem[] }> = [
    { title: $localize`Business`, items: [{ path: 'overview', label: $localize`Overview`, icon: 'space_dashboard' }, { path: 'stores', label: $localize`Stores`, icon: 'storefront' }, { path: 'trials', label: $localize`Trials`, icon: 'hourglass_top' }] },
    { title: $localize`Revenue`, items: [{ path: 'invoices', label: $localize`Invoices`, icon: 'receipt_long' }, { path: 'payments', label: $localize`Payments`, icon: 'payments' }, { path: 'requests', label: $localize`Plan requests`, icon: 'swap_vert', badge: () => this.requestCount() }] },
    { title: $localize`Platform`, items: [{ path: 'plans', label: $localize`Plans`, icon: 'sell' }, { path: 'audit', label: $localize`Audit log`, icon: 'history' }, { path: 'settings', label: $localize`Settings`, icon: 'tune' }] },
  ];

  constructor() {
    effect(() => {
      // Close the phone menu after navigating.
      if (this.nav$()) this.open.set(false);
    });
  }
}
