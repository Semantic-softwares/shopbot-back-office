import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LanguageMenuComponent } from '../shared/components/language-menu/language-menu.component';
import { ThemeToggleComponent } from '../shared/components/theme-toggle/theme-toggle.component';
import { PartnerPortalAuthService } from './partner-portal-auth.service';
import { PartnerPortalContext } from './partner-portal-context.service';

/** The frame around the signed-in portal: which hotel, where to go, and sign out. Reads well from a phone up to a desktop. */
@Component({
  selector: 'app-partner-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatFormFieldModule, MatIconModule, MatProgressBarModule, MatSelectModule, MatTooltipModule, LanguageMenuComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex min-h-screen flex-col bg-surface text-on-surface">
      <header class="sticky top-0 z-10 border-b border-outline-variant/60 bg-surface-container-lowest">
        <div class="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <a routerLink="/partner" class="flex items-center gap-2 text-lg font-semibold no-underline text-on-surface"><mat-icon class="text-primary">handshake</mat-icon><span i18n>Partner portal</span></a>
          <div class="ml-auto flex items-center gap-1">
            <app-language-menu /><app-theme-toggle />
            <button matIconButton (click)="auth.logout()" aria-label="Sign out" i18n-aria-label matTooltip="Sign out" i18n-matTooltip><mat-icon>logout</mat-icon></button>
          </div>
          <div class="order-last flex w-full flex-wrap items-center gap-3 sm:order-none sm:w-auto">
            @if (ctx.hotels().length > 1) {
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:w-64">
                <mat-label i18n>Hotel</mat-label>
                <mat-select [value]="ctx.current()?.storeId" (selectionChange)="ctx.choose($event.value)">
                  @for (h of ctx.hotels(); track h.storeId) { <mat-option [value]="h.storeId">{{ h.hotel.name }}</mat-option> }
                </mat-select>
              </mat-form-field>
            } @else if (ctx.current(); as c) {
              <span class="text-sm text-on-surface-variant"><strong class="text-on-surface">{{ c.hotel.name }}</strong> · {{ c.partner.name }}</span>
            }
          </div>
        </div>
        <nav class="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-3" aria-label="Portal">
          @for (item of nav; track item.link) {
            <a [routerLink]="item.link" routerLinkActive="!border-primary !text-primary" class="flex items-center gap-2 whitespace-nowrap border-0 border-b-2 border-solid border-transparent px-3 py-3 text-sm font-medium text-on-surface-variant no-underline hover:text-on-surface">
              <mat-icon class="!h-5 !w-5 !text-xl !leading-none">{{ item.icon }}</mat-icon>{{ item.label }}
            </a>
          }
        </nav>
      </header>
      @if (ctx.loading() && !ctx.current()) { <mat-progress-bar mode="indeterminate" /> }
      <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-20">
        @if (ctx.failed()) {
          <div class="flex flex-col items-center gap-2 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-900" role="alert">
            <p class="m-0 font-semibold" i18n>Could not load your hotels.</p>
            <button matButton="filled" (click)="ctx.reload()" i18n>Try again</button>
          </div>
        } @else if (!ctx.loading() && !ctx.current()) {
          <div class="flex flex-col items-center gap-2 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-10 text-center">
            <mat-icon class="!h-12 !w-12 !text-5xl !leading-none text-on-surface-variant">hotel</mat-icon>
            <p class="m-0 font-medium" i18n>No hotels are linked to your account.</p>
            <p class="m-0 max-w-md text-sm text-on-surface-variant" i18n>Ask the hotel to check that your partner is active and that you have portal access.</p>
          </div>
        } @else if (ctx.current()) {
          <router-outlet />
        }
      </main>
    </div>
  `,
})
export class PartnerShellComponent {
  protected readonly auth = inject(PartnerPortalAuthService);
  protected readonly ctx = inject(PartnerPortalContext);
  protected readonly nav = [
    { link: '/partner/search', icon: 'travel_explore', label: $localize`Find rooms` },
    { link: '/partner/requests', icon: 'outgoing_mail', label: $localize`My requests` },
    { link: '/partner/reservations', icon: 'event_available', label: $localize`My reservations` },
    { link: '/partner/commissions', icon: 'payments', label: $localize`My commissions` },
  ];
}
