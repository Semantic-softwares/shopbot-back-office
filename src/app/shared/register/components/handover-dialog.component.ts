import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreStore } from '../../stores/store.store';
import { ConnectivityService } from '../../offline/connectivity.service';
import { UserService } from '../../services/user.service';
import { RegisterApiService } from '../register-api.service';
import { RegisterContextService } from '../register-context.service';
import { RegisterTerminalService } from '../register-terminal.service';
import { denominationsFor } from '../register-denominations';
import { parseMajor, toMinor } from '../register-money';
import { CountRequest } from '../register.models';
import { DenominationCounterComponent } from './denomination-counter.component';

/**
 * Hands a shared register to the next cashier. The drawer and the session stay as they are; only who is working it changes. An optional
 * count of the drawer is recorded as an interim count against the cashier handing over: it is not a close, and the difference is never
 * put on the person taking over.
 */
@Component({
  selector: 'app-handover-dialog',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, DenominationCounterComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title class="!pb-1"><ng-container i18n>Hand over the register</ng-container></h2>
    <mat-dialog-content class="!pt-2">
      @if (net.offline()) {
        <div class="mb-3 flex items-start gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm"><mat-icon class="!h-5 !w-5 !text-xl !leading-none text-on-surface-variant">cloud_off</mat-icon><span><ng-container i18n>You need a connection to hand over a register.</ng-container></span></div>
      }
      @if (loading()) {
        <div class="flex justify-center py-10"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <p class="m-0 mb-2 text-sm font-medium"><ng-container i18n>Who is taking over?</ng-container></p>
        <div class="flex flex-col gap-2" role="radiogroup" data-testid="handover-people">
          @for (p of people(); track p.id) {
            <button type="button" role="radio" [attr.aria-checked]="to() === p.id" (click)="to.set(p.id)" class="flex items-center gap-3 rounded-lg border px-3 py-2 text-left" [class]="to() === p.id ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant bg-surface hover:bg-surface-container'" [attr.data-testid]="'handover-to-' + p.id">
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-sm">{{ p.name.charAt(0).toUpperCase() }}</span>
              <span class="font-medium">{{ p.name }}</span>
            </button>
          } @empty {
            <p class="m-0 text-sm text-on-surface-variant"><ng-container i18n>There is nobody else to hand over to.</ng-container></p>
          }
        </div>

        <label class="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" [ngModel]="counting()" (ngModelChange)="counting.set($event)" data-testid="handover-count-toggle" /><ng-container i18n>Count the drawer now</ng-container></label>
        @if (counting()) {
          <div class="mt-2">
            <div class="mb-2 flex gap-2 text-sm">
              <button type="button" class="rounded-full border px-3 py-1" [class]="!byNotes() ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant'" (click)="byNotes.set(false)"><ng-container i18n>Enter a total</ng-container></button>
              <button type="button" class="rounded-full border px-3 py-1" [class]="byNotes() ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant'" (click)="byNotes.set(true)"><ng-container i18n>Count notes and coins</ng-container></button>
            </div>
            @if (byNotes()) {
              <app-denomination-counter [denominations]="denominations()" [exponent]="ctx.exponent()" [currency]="symbol()" [(quantities)]="quantities" />
            } @else {
              <label class="flex items-center gap-2"><span class="text-sm text-on-surface-variant">{{ symbol() }}</span><input type="text" inputmode="decimal" class="w-full rounded-md border border-outline bg-surface px-3 py-2 text-on-surface" placeholder="0" [ngModel]="amountText()" (ngModelChange)="amountText.set($event)" data-testid="handover-amount" /></label>
            }
          </div>
        }
        <textarea class="mt-3 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface" rows="2" maxlength="500" placeholder="Handover notes (optional)" i18n-placeholder [ngModel]="notes()" (ngModelChange)="notes.set($event)" data-testid="handover-notes"></textarea>
        @if (error()) { <p class="mt-3 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container" role="alert" data-testid="handover-error">{{ error() }}</p> }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!px-6 !pb-4">
      <button matButton (click)="dialogRef.close()" [disabled]="submitting()"><ng-container i18n>Cancel</ng-container></button>
      <button matButton="filled" color="primary" [disabled]="!canSubmit()" (click)="submit()" data-testid="handover-submit">
        @if (submitting()) { <mat-spinner diameter="18" class="mr-2 inline-block"></mat-spinner> }
        <ng-container i18n>Hand over</ng-container>
      </button>
    </mat-dialog-actions>
  `,
})
export class HandoverDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<HandoverDialogComponent>);
  readonly ctx = inject(RegisterContextService);
  readonly net = inject(ConnectivityService);
  private readonly api = inject(RegisterApiService);
  private readonly users = inject(UserService);
  private readonly storeStore = inject(StoreStore);
  private readonly snack = inject(MatSnackBar);
  private readonly terminal = inject(RegisterTerminalService);

  loading = signal(true);
  people = signal<{ id: string; name: string }[]>([]);
  to = signal<string | null>(null);
  counting = signal(false);
  byNotes = signal(false);
  amountText = signal('');
  quantities = signal<Record<number, number>>({});
  notes = signal('');
  submitting = signal(false);
  error = signal<string | null>(null);

  symbol = computed(() => this.storeStore.selectedStore()?.currency || '');
  denominations = computed(() => denominationsFor(this.ctx.currencyCode(), this.ctx.settings()?.denominationOverride));
  private countMinor = computed<number | null>(() => {
    if (this.byNotes()) return this.denominations().reduce((sum, d) => sum + d.valueMinor * Math.max(0, Math.floor(Number(this.quantities()[d.valueMinor]) || 0)), 0);
    const m = parseMajor(this.amountText());
    return m === null ? null : toMinor(m, this.ctx.exponent());
  });
  canSubmit = computed(() => !this.submitting() && !this.net.offline() && !!this.to() && (!this.counting() || this.countMinor() !== null));

  ngOnInit(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    const me = this.ctx.current()?.assignment.cashierId;
    const myId = typeof me === 'string' ? me : me?._id;
    this.users.getTeamForStore(storeId).subscribe({
      next: (team) => {
        this.people.set(team.filter((m) => m.status === 'ACTIVE' && m.merchant._id !== myId).map((m) => ({ id: m.merchant._id, name: m.merchant.name })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submit(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    const sessionId = this.ctx.current()?.session._id;
    if (!storeId || !sessionId || !this.to()) return;
    let count: CountRequest | undefined;
    if (this.counting() && this.countMinor() !== null) {
      count = this.byNotes()
        ? { method: 'denomination', denominations: this.denominations().map((d) => ({ valueMinor: d.valueMinor, quantity: Math.max(0, Math.floor(Number(this.quantities()[d.valueMinor]) || 0)) })).filter((r) => r.quantity > 0), clientEventId: crypto.randomUUID() }
        : { method: 'manual', actualCashMinor: this.countMinor()!, clientEventId: crypto.randomUUID() };
    }
    this.submitting.set(true);
    this.error.set(null);
    this.api.handover(storeId, sessionId, { toCashierId: this.to()!, count, notes: this.notes().trim() || undefined, clientEventId: crypto.randomUUID() }).subscribe({
      next: () => {
        // On a shared terminal the next cashier signs in with their own PIN: the till is theirs now, not the one handing over.
        if (this.terminal.isTerminal()) this.terminal.clearOperator();
        this.ctx.refresh();
        this.snack.open($localize`Register handed over`, $localize`Close`, { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.status ? (err.error?.message ?? $localize`The handover could not be recorded.`) : $localize`Could not reach the server.`);
      },
    });
  }
}
