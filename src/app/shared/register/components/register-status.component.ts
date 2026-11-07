import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RolesService } from '../../services/roles.service';
import { RegisterContextService } from '../register-context.service';
import { RegisterTerminalService } from '../register-terminal.service';
import { CashMovementDialogComponent } from './cash-movement-dialog.component';
import { CloseRegisterDialogComponent } from './close-register-dialog.component';
import { HandoverDialogComponent } from './handover-dialog.component';
import { OpenRegisterDialogComponent } from './open-register-dialog.component';
import { PinSwitchDialogComponent } from './pin-switch-dialog.component';
import { RegisterReportDialogComponent } from './register-report-dialog.component';

/**
 * The toolbar's register light, shown only inside the POS and only for a store that uses registers: which register this cashier is on,
 * with the register actions in a menu so the checkout screen itself stays clear. Nothing renders for any other store.
 */
@Component({
  selector: 'app-register-status',
  imports: [MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (visible()) {
      @if (ctx.needsOperator()) {
        <button matButton="tonal" class="!h-9 !bg-amber-100 !px-3 !text-amber-900" (click)="switchCashier()" data-testid="register-signin-chip">
          <mat-icon>pin</mat-icon>
          <span class="max-sm:hidden"><ng-container i18n>Sign in with PIN</ng-container></span>
        </button>
      } @else if (ctx.current(); as c) {
        <button matButton="tonal" class="!h-9 !px-3" [matMenuTriggerFor]="menu" [class]="ctx.closing() ? '!bg-amber-100 !text-amber-900' : ''" data-testid="register-chip">
          <mat-icon>{{ c.register.acceptsCash ? 'point_of_sale' : 'credit_card' }}</mat-icon>
          <span class="max-sm:hidden">
            {{ c.register.name }}
            @if (ctx.closing()) { · <ng-container i18n>Closing</ng-container> }
          </span>
        </button>
        <mat-menu #menu="matMenu">
          @if (ctx.operatorName()) { <div class="px-4 py-2 text-xs text-on-surface-variant" data-testid="register-operator"><ng-container i18n>Signed in as</ng-container> {{ ctx.operatorName() }}</div> }
          <button mat-menu-item (click)="report()" data-testid="register-menu-xreport"><mat-icon>receipt_long</mat-icon><span><ng-container i18n>X-report</ng-container></span></button>
          @if (c.register.acceptsCash && !ctx.closing()) {
            @if (can('pos.register.cash_in')) { <button mat-menu-item (click)="movement('cash_in')" data-testid="register-menu-cashin"><mat-icon>add_card</mat-icon><span><ng-container i18n>Cash in</ng-container></span></button> }
            @if (can('pos.register.cash_out')) { <button mat-menu-item (click)="movement('cash_out')" data-testid="register-menu-cashout"><mat-icon>payments</mat-icon><span><ng-container i18n>Cash out</ng-container></span></button> }
          }
          @if (c.register.operatingMode === 'shared' && ctx.settings()?.allowCashierHandover && can('pos.register.handover') && !ctx.closing()) {
            <button mat-menu-item (click)="handover()" data-testid="register-menu-handover"><mat-icon>swap_horiz</mat-icon><span><ng-container i18n>Hand over</ng-container></span></button>
          }
          @if (terminal.isTerminal()) {
            <button mat-menu-item (click)="switchCashier()" data-testid="register-menu-switch"><mat-icon>switch_account</mat-icon><span><ng-container i18n>Switch cashier</ng-container></span></button>
            <button mat-menu-item (click)="lock()" data-testid="register-menu-lock"><mat-icon>lock_person</mat-icon><span><ng-container i18n>Lock</ng-container></span></button>
          }
          <mat-divider></mat-divider>
          @if (can('pos.register.close')) {
            <button mat-menu-item (click)="close()" data-testid="register-menu-close"><mat-icon>lock</mat-icon><span>@if (ctx.closing()) { <ng-container i18n>Continue closing</ng-container> } @else { <ng-container i18n>Close register</ng-container> }</span></button>
          }
        </mat-menu>
      } @else {
        <button matButton="tonal" class="!h-9 !bg-amber-100 !px-3 !text-amber-900" (click)="open()" data-testid="register-open-chip">
          <mat-icon>lock_open</mat-icon>
          <span class="max-sm:hidden"><ng-container i18n>Open register</ng-container></span>
        </button>
        @if (terminal.isTerminal()) {
          <button matButton class="!h-9 !px-2" (click)="switchCashier()" data-testid="register-switch-chip" aria-label="Switch cashier" i18n-aria-label><mat-icon>switch_account</mat-icon><span class="max-sm:hidden">{{ ctx.operatorName() }}</span></button>
        }
      }
    }
  `,
})
export class RegisterStatusComponent {
  readonly ctx = inject(RegisterContextService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly roles = inject(RolesService);
  readonly terminal = inject(RegisterTerminalService);

  private readonly url = toSignal(this.router.events.pipe(filter((e) => e instanceof NavigationEnd), map(() => this.router.url), startWith(this.router.url)), { initialValue: this.router.url });
  /** Only inside the POS, and only for a store that has switched registers on. */
  visible = computed(() => this.ctx.enabled() && this.url().includes('/menu/pos'));

  can(code: string): boolean {
    return this.roles.isAdmin() || this.roles.has(code);
  }

  open(): void {
    this.dialog.open(OpenRegisterDialogComponent, { width: '520px', maxWidth: '96vw', maxHeight: '92vh' });
  }

  close(): void {
    this.dialog.open(CloseRegisterDialogComponent, { width: '560px', maxWidth: '96vw', maxHeight: '92vh', disableClose: true });
  }

  handover(): void {
    this.dialog.open(HandoverDialogComponent, { width: '480px', maxWidth: '96vw', maxHeight: '92vh' });
  }

  switchCashier(): void {
    this.dialog.open(PinSwitchDialogComponent, { width: '420px', maxWidth: '96vw', maxHeight: '92vh' });
  }

  /** Locks the till: the next person signs in with their PIN. */
  lock(): void {
    this.terminal.clearOperator();
    this.ctx.refresh();
  }

  movement(type: 'cash_in' | 'cash_out'): void {
    this.dialog.open(CashMovementDialogComponent, { width: '460px', maxWidth: '96vw', data: { type } });
  }

  report(): void {
    const sessionId = this.ctx.current()?.session._id;
    if (sessionId) this.dialog.open(RegisterReportDialogComponent, { width: '560px', maxWidth: '96vw', maxHeight: '92vh', data: { sessionId, kind: 'X' } });
  }
}
