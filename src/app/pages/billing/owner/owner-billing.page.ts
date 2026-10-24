import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, firstValueFrom } from 'rxjs';
import { ReasonDialogComponent } from '../../../menu/super-admin/dialogs/admin-dialogs';
import { BillingStateService, billingCallbackUrl } from '../../../shared/billing/billing-state.service';
import { Billing } from '../../../menu/administrative-settings/billing/billing';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';
import { BillingPlan, PlanChangeQuote } from '../../../shared/models/platform-billing.model';
import { PlatformBillingService } from '../../../shared/services/platform-billing.service';

const MODULES = [
  { key: 'POS', label: $localize`Point of sale`, hint: $localize`Counter, restaurant and bar sales, online or offline`, icon: 'point_of_sale' },
  { key: 'ERP', label: $localize`ERP and inventory`, hint: $localize`Stock, suppliers, purchasing and reports`, icon: 'inventory_2' },
  { key: 'PMS', label: $localize`Hotel (HMS)`, hint: $localize`Reservations, rooms, housekeeping and guests`, icon: 'hotel' },
  { key: 'EMS', label: $localize`Estates (EMS)`, hint: $localize`Leases, tenants, units and property invoicing`, icon: 'apartment' },
  { key: 'KDS', label: $localize`Kitchen display`, hint: $localize`Orders on the kitchen screen`, icon: 'soup_kitchen' },
];

/** Shows what moving to a plan would cost, from the server's own quote, and applies it only after the owner agrees. */
@Component({
  selector: 'app-plan-change-dialog',
  imports: [CurrencyPipe, DatePipe, MatButtonModule, MatDialogModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h2 mat-dialog-title>{{ plan.name }}</h2>
    <mat-dialog-content>
      @if (!quote()) { <mat-progress-bar mode="indeterminate" /> }
      @if (quote(); as q) {
        @switch (q.outcome) {
          @case ('REFUSED') { <p class="msg msg--bad" role="alert" data-testid="quote-refused">{{ q.refusal?.message }}</p> }
          @case ('REQUEST') { <p class="msg"><ng-container i18n>This plan is priced for your business. Send a request and we will contact you with a price.</ng-container></p> }
          @case ('SCHEDULED') { <p class="msg"><ng-container i18n>You move to this plan at the end of your current period, on</ng-container> <b>{{ q.scheduledFor | date: 'mediumDate' }}</b>. <ng-container i18n>Until then nothing changes and nothing is charged.</ng-container></p> }
          @default {
            <p class="msg"><ng-container i18n>You move to this plan today.</ng-container></p>
            @if (q.proration; as p) {
              <div class="rows" data-testid="quote-rows">
                <div><span i18n>New plan for the rest of this period</span><b>{{ p.chargeForRemainder | currency: currency }}</b></div>
                @if (p.creditApplied > 0) { <div><span i18n>Credit for what you already paid</span><b>−{{ p.creditApplied | currency: currency }}</b></div> }
                <div class="rows__total"><span i18n>To pay now</span><b>{{ p.netCharge | currency: currency }}</b></div>
              </div>
            } @else { <p class="msg msg--soft"><ng-container i18n>Your free trial continues and nothing is charged now.</ng-container></p> }
          }
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close i18n>Close</button>
      @if (quote() && quote()!.outcome !== 'REFUSED') {
        <button mat-flat-button color="primary" [disabled]="busy()" (click)="confirm()" data-testid="quote-confirm">
          @switch (quote()!.outcome) { @case ('REQUEST') { <ng-container i18n>Send request</ng-container> } @case ('SCHEDULED') { <ng-container i18n>Schedule the change</ng-container> } @default { <ng-container i18n>Confirm</ng-container> } }
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: `
    .msg { margin: 0 0 16px; font-size: 14px; line-height: 1.5; }
    .msg--bad { color: light-dark(#991b1b, #fecaca); }
    .msg--soft { color: var(--mat-sys-on-surface-variant); }
    .rows { display: grid; gap: 8px; padding: 14px 16px; border-radius: 14px; background: var(--mat-sys-surface-container); font-size: 14px; }
    .rows > div { display: flex; justify-content: space-between; gap: 16px; }
    .rows b { font-variant-numeric: tabular-nums; }
    .rows__total { padding-top: 8px; border-top: 1px solid var(--mat-sys-outline-variant); font-size: 16px; }
  `,
})
export class PlanChangeDialogComponent {
  private readonly api = inject(PlatformBillingService);
  private readonly ref = inject(MatDialogRef<PlanChangeDialogComponent>);
  readonly plan = inject<BillingPlan>(MAT_DIALOG_DATA);
  readonly quote = signal<PlanChangeQuote | null>(null);
  readonly busy = signal(false);
  readonly currency = this.plan.currency;

  constructor() {
    this.api.previewPlanChange(this.plan.key).subscribe({
      next: (q) => this.quote.set(q),
      error: (e) => this.quote.set({ outcome: 'REFUSED', refusal: { code: 'ERROR', message: e?.error?.message ?? $localize`Could not work out the price. Please try again.` }, fromPlanKey: null, toPlanKey: this.plan.key, toPlanName: this.plan.name, fromAmount: 0, toAmount: null, seats: 0, maxSeats: null, netCharge: 0 }),
    });
  }

  confirm(): void {
    this.busy.set(true);
    this.api.changePlan(this.plan.key, this.quote()!.netCharge).subscribe({
      next: (r) => this.ref.close(r),
      error: (e) => {
        this.busy.set(false);
        this.quote.set({ ...this.quote()!, outcome: 'REFUSED', refusal: { code: 'ERROR', message: e?.error?.message ?? $localize`That did not work. Please try again.` } });
      },
    });
  }
}

@Component({
  selector: 'app-owner-billing',
  imports: [CurrencyPipe, DatePipe, MatButtonModule, MatCardModule, MatCheckboxModule, MatIconModule, MatProgressBarModule, StatusPillComponent, Billing],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="page">
      <header class="head">
        <div>
          <h1 class="h1" i18n>Billing</h1>
          <p class="sub" i18n>Your plan, your team and your invoices. Every plan includes every module.</p>
        </div>
        @if (sub(); as s) { <app-status-pill [value]="s.status" /> }
      </header>

      @if (res.isLoading() && !res.hasValue()) { <mat-progress-bar mode="indeterminate" /> }
      @if (res.error() && !res.hasValue()) {
        <mat-card appearance="outlined"><mat-card-content class="empty" role="alert"><p class="m-0 font-semibold" i18n>Could not load your billing.</p><button mat-flat-button (click)="res.reload()" i18n>Try again</button></mat-card-content></mat-card>
      }

      @if (account(); as a) {
        @let s = a.subscription;
        @if (s.billingVersion !== 2) {
          <!-- Stores not yet moved to the new plans keep the screen they had. -->
          <app-billing />
        } @else {
          <section class="tiles" data-testid="summary">
            <div class="tile"><div class="tile__k" i18n>Plan</div><div class="tile__v capitalize">{{ s.planName || s.planKey || '—' }}</div>
              <div class="tile__h">@if (s.amount) { {{ s.amount | currency: s.currency || 'USD' }} / {{ s.interval === 'YEAR' ? 'year' : 'month' }} } @else { <ng-container i18n>No charge</ng-container> }</div></div>
            <div class="tile"><div class="tile__k" i18n>Team</div><div class="tile__v">{{ s.seatCount }}<span class="tile__of"> / {{ s.seatCap ?? '∞' }}</span></div>
              @if (s.seatCap) { <div class="bar"><div class="bar__fill" [class.bar__fill--over]="s.seatCount > s.seatCap" [style.width.%]="seatPercent()"></div></div> }
              <div class="tile__h" i18n>people who can sign in</div></div>
            <div class="tile"><div class="tile__k">@if (s.status === 'TRIAL') { <ng-container i18n>Trial ends</ng-container> } @else if (s.cancelAtPeriodEnd) { <ng-container i18n>Ends on</ng-container> } @else { <ng-container i18n>Renews on</ng-container> }</div>
              <div class="tile__v">{{ (s.status === 'TRIAL' ? s.trialEndsAt : s.currentPeriodEnd) ? ((s.status === 'TRIAL' ? s.trialEndsAt : s.currentPeriodEnd) | date: 'mediumDate' : 'UTC') : '—' }}</div>
              @if (s.daysRemaining !== null) { <div class="tile__h">{{ s.daysRemaining }} <ng-container i18n>days left</ng-container></div> }</div>
            <div class="tile"><div class="tile__k" i18n>Payment</div><div class="tile__v tile__v--sm">@if (s.hasCard) { <ng-container i18n>Card on file</ng-container> } @else { <ng-container i18n>By invoice</ng-container> }</div><div class="tile__h" i18n>Card or bank transfer</div></div>
          </section>

          @if (open().length) {
            <mat-card appearance="outlined" class="due" data-testid="open-invoices"><mat-card-content class="due__body">
              <h2 class="h2"><mat-icon>receipt_long</mat-icon><span i18n>Waiting for payment</span></h2>
              @for (i of open(); track i._id) {
                <div class="due__row"><div class="due__no"><b>{{ i.invoiceNumber }}</b><span class="muted"><ng-container i18n>due</ng-container> {{ i.dueDate | date: 'mediumDate' : 'UTC' }}</span></div>
                  <b class="num">{{ i.amountDue ?? i.total ?? i.amount | currency: i.currency }}</b>
                  <button mat-flat-button color="primary" [disabled]="busy()" (click)="pay(i._id)" data-testid="pay-invoice"><mat-icon>credit_card</mat-icon><span i18n>Pay by card</span></button></div>
              }
              @if (a.bankTransferInstructions) { <div class="bank"><b i18n>Or pay by bank transfer</b><p>{{ a.bankTransferInstructions }}</p><p class="muted" i18n>Use the invoice number as the reference. We record the transfer and your plan is updated.</p></div> }
            </mat-card-content></mat-card>
          }

          @if (s.pendingPlanKey) {
            <div class="notice"><mat-icon>schedule</mat-icon><span class="flex-1"><ng-container i18n>Your plan changes to</ng-container> <b class="capitalize">{{ s.pendingPlanKey }}</b> <ng-container i18n>on</ng-container> {{ s.planChangesAt | date: 'mediumDate' }}.</span><button mat-button (click)="undoChange()" i18n>Cancel the change</button></div>
          }
          @if (s.cancelAtPeriodEnd) {
            <div class="notice notice--warn"><mat-icon>event_busy</mat-icon><span class="flex-1"><ng-container i18n>Your subscription ends on</ng-container> <b>{{ s.currentPeriodEnd | date: 'mediumDate' : 'UTC' }}</b>.</span><button mat-flat-button (click)="keep()" data-testid="keep-plan" i18n>Keep my plan</button></div>
          }

          <section>
            <h2 class="h2" i18n>Plans</h2>
            <div class="plans" data-testid="plans">
              @for (p of a.plans; track p.key) {
                @let f = fit(p.key);
                <article class="plan" [class.plan--current]="p.key === s.planKey">
                  <div class="plan__top"><h3 class="plan__name">{{ p.name }}</h3>@if (p.key === s.planKey) { <span class="tag" i18n>Current</span> }</div>
                  <div class="plan__price">@if (priceOf(p) !== null) { {{ priceOf(p) | currency: p.currency : 'symbol' : '1.0-2' }}<small> / {{ s.interval === 'YEAR' ? 'year' : 'month' }}</small> } @else { <span class="plan__ask" i18n>By agreement</span> }</div>
                  <div class="plan__seats">{{ p.minSeats }}–{{ p.maxSeats ?? '∞' }} <ng-container i18n>people</ng-container></div>
                  @if (p.description) { <p class="plan__desc">{{ p.description }}</p> }
                  @if (f && !f.fits) { <p class="plan__warn">{{ f.reason }}</p> }
                  <button mat-stroked-button class="plan__btn" [disabled]="busy() || p.key === s.planKey || (f && !f.fits)" (click)="choose(p)" [attr.data-testid]="'choose-' + p.key">
                    @if (p.key === s.planKey) { <ng-container i18n>Your plan</ng-container> } @else if (p.contactUsOnly || priceOf(p) === null) { <ng-container i18n>Ask for a price</ng-container> } @else { <ng-container i18n>Choose</ng-container> }
                  </button>
                </article>
              }
            </div>
          </section>

          <section>
            <h2 class="h2" i18n>Modules</h2>
            <mat-card appearance="outlined"><mat-card-content class="mods">
              <p class="muted m-0" i18n>Switch modules on or off any time. It never changes your price.</p>
              <div class="mods__grid">
                @for (m of modules; track m.key) {
                  <div class="mod" [class.mod--on]="chosen().includes(m.key)">
                    <mat-checkbox [checked]="chosen().includes(m.key)" (change)="toggle(m.key, $event.checked)" [attr.data-testid]="'owner-mod-' + m.key">
                      <span class="mod__label"><mat-icon class="mod__icon">{{ m.icon }}</mat-icon><span class="mod__text"><b>{{ m.label }}</b><span class="muted">{{ m.hint }}</span></span></span>
                    </mat-checkbox>
                  </div>
                }
              </div>
              <div><button mat-flat-button color="primary" [disabled]="busy() || !chosen().length || !modulesChanged()" (click)="saveModules()" data-testid="owner-save-modules" i18n>Save modules</button></div>
            </mat-card-content></mat-card>
          </section>

          <section>
            <h2 class="h2" i18n>Invoices</h2>
            <mat-card appearance="outlined" class="overflow-x-auto"><table class="tbl" data-testid="owner-invoices">
              <thead><tr><th i18n>Number</th><th i18n>Period</th><th class="r" i18n>Total</th><th i18n>Status</th><th></th></tr></thead>
              <tbody>@for (i of invoices(); track i._id) {
                <tr><td><b>{{ i.invoiceNumber }}</b></td><td>{{ i.billingPeriodStart | date: 'mediumDate' : 'UTC' }} – {{ i.billingPeriodEnd | date: 'mediumDate' : 'UTC' }}</td><td class="r num">{{ i.total ?? i.amount | currency: i.currency }}</td><td><app-status-pill kind="invoice" [value]="i.status" /></td>
                  <td class="r"><button mat-icon-button (click)="pdf(i._id, i.invoiceNumber)" aria-label="Download PDF" i18n-aria-label><mat-icon>picture_as_pdf</mat-icon></button></td></tr>
              } @empty { <tr><td colspan="5" class="empty-cell" i18n>No invoices yet. Your first one is raised before your trial ends.</td></tr> }</tbody></table></mat-card>
          </section>

          @if (!s.cancelAtPeriodEnd && s.status !== 'TRIAL') {
            <section class="danger"><div><b i18n>Cancel subscription</b><p class="muted m-0" i18n>You keep full access until the end of the period you have paid for.</p></div><button mat-stroked-button color="warn" [disabled]="busy()" (click)="cancel()" data-testid="cancel-sub" i18n>Cancel</button></section>
          }
        }
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .page { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; max-width: 1080px; margin: 0 auto; padding: 24px 16px 48px; }
    .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .head > div { flex: 1; min-width: 0; }
    .h1 { margin: 0; font-size: 28px; font-weight: 700; line-height: 1.2; }
    .sub { margin: 6px 0 0; color: var(--mat-sys-on-surface-variant); font-size: 14px; }
    .h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; font-size: 18px; font-weight: 600; }
    .muted { color: var(--mat-sys-on-surface-variant); font-size: 13px; }
    .num { font-variant-numeric: tabular-nums; }
    .tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .tile { padding: 16px; border: 1px solid var(--mat-sys-outline-variant); border-radius: 16px; background: var(--mat-sys-surface); }
    .tile__k { font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--mat-sys-on-surface-variant); }
    .tile__v { margin-top: 6px; font-size: 24px; font-weight: 700; line-height: 1.2; }
    .tile__v--sm { font-size: 18px; }
    .tile__of { font-size: 16px; font-weight: 500; color: var(--mat-sys-on-surface-variant); }
    .tile__h { margin-top: 4px; font-size: 13px; color: var(--mat-sys-on-surface-variant); }
    .bar { height: 6px; margin-top: 10px; border-radius: 99px; background: var(--mat-sys-surface-container-high); overflow: hidden; }
    .bar__fill { height: 100%; border-radius: 99px; background: var(--mat-sys-primary); }
    .bar__fill--over { background: light-dark(#dc2626, #f87171); }
    .due__body { display: grid; gap: 12px; padding: 20px !important; }
    .due__row { display: flex; align-items: center; gap: 16px; padding: 12px 14px; border-radius: 14px; background: var(--mat-sys-surface-container-low); }
    .due__no { display: grid; flex: 1; gap: 2px; }
    .bank { padding: 14px 16px; border-radius: 14px; background: var(--mat-sys-surface-container); font-size: 14px; }
    .bank p { margin: 6px 0 0; white-space: pre-line; line-height: 1.5; }
    .notice { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; background: light-dark(#e0f2fe, #0c2a3d); color: light-dark(#075985, #bae6fd); font-size: 14px; }
    .notice--warn { background: light-dark(#fef3c7, #3a2a0a); color: light-dark(#78350f, #fde68a); }
    .plans { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
    .plan { display: flex; flex-direction: column; padding: 18px; border: 1px solid var(--mat-sys-outline-variant); border-radius: 18px; background: var(--mat-sys-surface); }
    .plan--current { border: 2px solid var(--mat-sys-primary); padding: 17px; }
    .plan__top { display: flex; align-items: center; gap: 8px; }
    .plan__name { margin: 0; font-size: 18px; font-weight: 700; }
    .tag { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); }
    .plan__price { margin-top: 10px; font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .plan__price small { font-size: 13px; font-weight: 500; color: var(--mat-sys-on-surface-variant); }
    .plan__ask { font-size: 18px; }
    .plan__seats { margin-top: 4px; font-size: 14px; font-weight: 500; }
    .plan__desc { margin: 8px 0 0; font-size: 13px; color: var(--mat-sys-on-surface-variant); line-height: 1.45; }
    .plan__warn { margin: 8px 0 0; font-size: 13px; color: light-dark(#92400e, #fcd34d); }
    .plan__btn { margin-top: auto !important; align-self: stretch; }
    .plan > .plan__btn, .plan > p + .plan__btn { margin-top: 16px !important; }
    .mods { display: grid; gap: 16px; padding: 20px !important; }
    .mods__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
    .mod { padding: 6px 12px 6px 4px; border: 1px solid var(--mat-sys-outline-variant); border-radius: 14px; }
    .mod__label { display: flex; align-items: center; gap: 8px; }
    .mod--on { border-color: var(--mat-sys-primary); background: var(--mat-sys-surface-container-low); }
    .mod__icon { flex: none; color: var(--mat-sys-on-surface-variant); }
    .mod__text { display: grid; gap: 1px; font-size: 14px; min-width: 0; }
    .tbl { width: 100%; min-width: 560px; border-collapse: collapse; font-size: 14px; }
    .tbl th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--mat-sys-on-surface-variant); }
    .tbl td { padding: 10px 16px; border-top: 1px solid var(--mat-sys-outline-variant); }
    .tbl .r { text-align: right; }
    .empty-cell { padding: 28px 16px !important; text-align: center; color: var(--mat-sys-on-surface-variant); }
    .empty { display: flex; align-items: center; gap: 12px; padding: 24px !important; }
    .danger { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 18px; border: 1px solid light-dark(#fca5a5, #7f1d1d); border-radius: 16px; }
    @media (max-width: 900px) { .tiles { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .page { padding: 16px 12px 40px; } .tiles { grid-template-columns: 1fr 1fr; gap: 8px; } .tile { padding: 12px; } .tile__v { font-size: 20px; } .due__row { flex-wrap: wrap; } .due__row button { width: 100%; } .danger { flex-direction: column; align-items: stretch; } }
  `,
})
export class OwnerBillingPage {
  private readonly api = inject(PlatformBillingService);
  private readonly billing = inject(BillingStateService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly res = rxResource({ stream: () => this.billing.refresh() });
  readonly invoicesRes = rxResource({ stream: () => this.api.invoices(24, 0) });
  readonly account = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly sub = computed(() => this.account()?.subscription ?? null);
  readonly invoices = computed(() => (this.invoicesRes.hasValue() ? this.invoicesRes.value().invoices : []));
  readonly open = computed(() => this.invoices().filter((i) => i.status === 'PENDING'));
  readonly modules = MODULES;
  readonly chosen = signal<string[]>([]);
  readonly busy = signal(false);
  readonly seatPercent = computed(() => {
    const s = this.sub();
    return s?.seatCap ? Math.min(100, Math.round((s.seatCount / s.seatCap) * 100)) : 0;
  });
  readonly modulesChanged = computed(() => {
    const cur = [...(this.sub()?.modules ?? [])].sort().join();
    return cur !== [...this.chosen()].sort().join();
  });

  constructor() {
    effect(() => {
      const s = this.sub();
      if (s) this.chosen.set([...s.modules]);
    });
  }

  fit(key: string) {
    return this.account()?.fit.find((f) => f.planKey === key);
  }
  priceOf(p: BillingPlan): number | null {
    return (this.sub()?.interval === 'YEAR' ? p.yearlyPrice : p.monthlyPrice) ?? null;
  }
  toggle(key: string, on: boolean): void {
    this.chosen.update((cur) => (on ? [...new Set([...cur, key])] : cur.filter((k) => k !== key)));
  }

  private reload(): void {
    this.res.reload();
    this.invoicesRes.reload();
  }
  private async act(call: Observable<unknown>, done: string): Promise<boolean> {
    this.busy.set(true);
    try {
      await firstValueFrom(call);
      this.snack.open(done, $localize`Close`, { duration: 3500 });
      this.reload();
      return true;
    } catch (e: any) {
      this.snack.open(e?.error?.message ?? $localize`That did not work. Please try again.`, $localize`Close`, { duration: 6000 });
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  async pay(invoiceId: string): Promise<void> {
    this.busy.set(true);
    try {
      const { checkoutUrl } = await firstValueFrom(this.api.payInvoice(invoiceId, billingCallbackUrl()));
      window.location.assign(checkoutUrl);
    } catch (e: any) {
      this.snack.open(e?.error?.message ?? $localize`Could not start the payment. Please try again.`, $localize`Close`, { duration: 6000 });
      this.busy.set(false);
    }
  }

  async choose(plan: BillingPlan): Promise<void> {
    const result = await firstValueFrom(this.dialog.open(PlanChangeDialogComponent, { data: plan, width: '440px', maxWidth: '94vw' }).afterClosed());
    if (!result) return;
    this.reload();
    if (result.request) this.snack.open($localize`Request sent. We will contact you with a price.`, $localize`Close`, { duration: 5000 });
    else if (result.invoice && (result.invoice.amountDue ?? 0) > 0) await this.pay(result.invoice._id);
    else this.snack.open($localize`Plan updated`, $localize`Close`, { duration: 3500 });
  }

  saveModules(): void {
    void this.act(this.api.setModules(this.chosen()), $localize`Modules saved`);
  }
  undoChange(): void {
    void this.act(this.api.cancelScheduledChange(), $localize`Plan change cancelled`);
  }
  keep(): void {
    void this.act(this.api.keep(), $localize`Your subscription will continue`);
  }
  async cancel(): Promise<void> {
    const reason = await firstValueFrom(this.dialog.open(ReasonDialogComponent, { data: { title: $localize`Cancel your subscription?`, message: $localize`You keep full access until the end of the period you have paid for. You can change your mind before then.`, confirm: $localize`Cancel subscription`, warn: true }, width: '440px', maxWidth: '92vw' }).afterClosed());
    if (!reason) return;
    await this.act(this.api.cancel(typeof reason === 'string' ? reason : undefined), $localize`Cancellation scheduled`);
  }

  async pdf(id: string, number: string): Promise<void> {
    try {
      const blob = await firstValueFrom(this.api.invoicePdf(id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      this.snack.open($localize`Could not make the PDF. Please try again.`, $localize`Close`, { duration: 5000 });
    }
  }
}
