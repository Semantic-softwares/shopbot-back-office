import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Observable, firstValueFrom } from 'rxjs';
import { StatusPillComponent } from '../../../../shared/components/status-pill/status-pill.component';
import { TrPipe } from '../../../../shared/i18n/tr.pipe';
import { SubStatus } from '../../../../shared/models/platform-billing.model';
import { PlatformBillingService } from '../../../../shared/services/platform-billing.service';
import { ReportKpiComponent } from '../../../dashboard/reports/shared/report-kpi.component';
import { ReasonDialogComponent } from '../../dialogs/admin-dialogs';

const MODULES = [
  { key: 'POS', label: $localize`Point of sale`, icon: 'point_of_sale' },
  { key: 'ERP', label: $localize`ERP and inventory`, icon: 'inventory_2' },
  { key: 'PMS', label: $localize`Hotel (HMS)`, icon: 'hotel' },
  { key: 'EMS', label: $localize`Estates (EMS)`, icon: 'apartment' },
  { key: 'KDS', label: $localize`Kitchen display`, icon: 'soup_kitchen' },
];
const LOCKING: SubStatus[] = ['SUSPENDED', 'CANCELLED', 'EXPIRED'];

@Component({
  selector: 'app-admin-store-detail',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, MatButtonModule, MatCardModule, MatCheckboxModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule, MatSelectModule, MatTabsModule, ReportKpiComponent, StatusPillComponent, TrPipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <a mat-button routerLink="../" class="!-ml-2 mb-2"><mat-icon>arrow_back</mat-icon><span i18n>All stores</span></a>
    @if (res.isLoading() && !res.hasValue()) { <mat-progress-bar mode="indeterminate" /> }
    @if (res.error() && !res.hasValue()) {
      <div class="rounded-3xl border border-outline-variant p-8 text-center" role="alert"><p class="m-0 font-semibold" i18n>Could not load this store.</p><button mat-flat-button class="!mt-3" (click)="res.reload()" i18n>Try again</button></div>
    } @else if (res.hasValue()) {
      @let d = res.value();
      @let c = d.context;
      <div class="mb-4 mt-1 flex flex-wrap items-center gap-3">
        <h1 class="m-0 text-2xl font-bold" data-testid="store-name">{{ d.store.name }}</h1>
        <app-status-pill [value]="c.status" />
        @if (c.blocked) { <span class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800" i18n>cannot sign in</span> }
        @if (c.seatCap && c.seatCount > c.seatCap) { <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900" i18n>over its seats</span> }
        @if (c.billingVersion === 1) { <span class="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-800" i18n>old billing</span> }
        <span class="text-xs text-on-surface-variant"><span i18n>Since</span> {{ d.store.createdAt | date: 'mediumDate' }}</span>
      </div>

      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <app-report-kpi label="Plan" i18n-label icon="sell" [hint]="c.amount ? ((c.amount | currency: c.currency || 'USD') + (c.interval === 'YEAR' ? ' / year' : ' / month')) : ''"><span class="capitalize">{{ c.planName || c.planKey || '—' }}</span></app-report-kpi>
        <app-report-kpi label="Seats" i18n-label icon="group" [hint]="c.seatCap ? 'of ' + c.seatCap : 'no limit'">{{ c.seatCount }}</app-report-kpi>
        <app-report-kpi label="Paid through" i18n-label icon="event" [hint]="deadlineHint()">{{ (c.status === 'TRIAL' ? c.trialEndsAt : c.currentPeriodEnd) ? ((c.status === 'TRIAL' ? c.trialEndsAt : c.currentPeriodEnd) | date: 'mediumDate' : 'UTC') : '—' }}</app-report-kpi>
        <app-report-kpi label="Owes" i18n-label icon="pending_actions" [tone]="owed() > 0 ? 'text-amber-600' : ''">{{ owed() | currency: c.currency || 'USD' }}</app-report-kpi>
      </div>

      @if (d.upgradeRequest) {
        <div class="mt-3 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><mat-icon>swap_vert</mat-icon><span class="flex-1" i18n>This store asked for the {{ d.upgradeRequest.requestedPlanKey }} plan. Agree a price in the Subscription tab, then mark the request done.</span><a mat-stroked-button routerLink="../../requests" i18n>Plan requests</a></div>
      }

      <mat-tab-group class="mt-4" animationDuration="0ms" [selectedIndex]="tab()" (selectedIndexChange)="tab.set($event)">
        <mat-tab label="Overview" i18n-label>
          <div class="grid gap-4 py-4 lg:grid-cols-2">
            <mat-card appearance="outlined"><mat-card-content class="!p-4">
              <h3 class="m-0 mb-2 text-sm font-semibold" i18n>Owner</h3>
              @if (d.owner) { <div class="font-medium">{{ d.owner.name }}</div><a class="text-sm text-primary" [href]="'mailto:' + d.owner.email">{{ d.owner.email }}</a><div class="text-sm text-on-surface-variant">{{ d.owner.phoneNumber }}</div> } @else { <span class="text-sm text-on-surface-variant" i18n>No owner on record.</span> }
              <h3 class="m-0 mb-1 mt-4 text-sm font-semibold" i18n>Modules on</h3>
              <div class="flex flex-wrap gap-2">@for (m of d.modules; track m) { <span class="rounded-full bg-surface-container-high px-2 py-0.5 text-xs font-medium">{{ moduleLabel(m) }}</span> } @empty { <span class="text-sm text-on-surface-variant" i18n>None.</span> }</div>
            </mat-card-content></mat-card>
            <mat-card appearance="outlined"><mat-card-content class="!p-4">
              <h3 class="m-0 mb-2 text-sm font-semibold" i18n>Subscription history</h3>
              @for (h of history(); track $index) { <div class="flex items-center gap-2 border-t border-outline-variant py-1.5 text-sm first:border-t-0"><app-status-pill [value]="h.to" /><span class="flex-1 truncate text-on-surface-variant">{{ h.reason }}</span><span class="shrink-0 text-xs text-on-surface-variant">{{ h.at | date: 'mediumDate' }}</span></div> } @empty { <span class="text-sm text-on-surface-variant" i18n>Nothing yet.</span> }
            </mat-card-content></mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Subscription" i18n-label>
          <div class="grid gap-4 py-4 lg:grid-cols-2" data-testid="sub-tab">
            @if (!d.subscription) {
              <mat-card appearance="outlined" class="lg:col-span-2"><mat-card-content class="!p-4"><p class="mt-0" i18n>This store has no subscription. Start its free trial to put it on the platform billing.</p><button mat-flat-button color="primary" [disabled]="busy()" (click)="startTrial()" data-testid="start-trial" i18n>Start a trial</button></mat-card-content></mat-card>
            } @else {
              <mat-card appearance="outlined"><mat-card-content class="!p-4">
                <h3 class="m-0 text-sm font-semibold" i18n>Time</h3>
                <p class="mb-3 mt-1 text-xs text-on-surface-variant" i18n>Give time without a payment, or set an exact paid-through date. Either restores access straight away.</p>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic"><mat-label i18n>Extend by</mat-label>
                  <mat-select [ngModel]="extendBy()" (ngModelChange)="extendBy.set($event)" data-testid="extend-by">@for (m of [1, 2, 3, 6, 12]; track m) { <mat-option [value]="m">{{ m }} <span i18n>month(s)</span></mat-option> }<mat-option value="date" i18n>Choose a date…</mat-option></mat-select></mat-form-field>
                @if (extendBy() === 'date') {
                  <mat-form-field appearance="outline" class="mt-3 w-full" subscriptSizing="dynamic"><mat-label i18n>Paid through</mat-label><input matInput [matDatepicker]="dp" [ngModel]="until()" (ngModelChange)="until.set($event)" data-testid="extend-date" /><mat-datepicker-toggle matIconSuffix [for]="dp" /><mat-datepicker #dp /></mat-form-field>
                  @if (shortening()) { <p class="mb-0 mt-2 text-sm text-amber-700" i18n>That is earlier than the current paid-through date, so it shortens it.</p> }
                }
                <mat-form-field appearance="outline" class="mt-3 w-full" subscriptSizing="dynamic"><mat-label i18n>Reason (optional)</mat-label><input matInput maxlength="500" [ngModel]="extendReason()" (ngModelChange)="extendReason.set($event)" /></mat-form-field>
                <button mat-flat-button color="primary" class="!mt-3" [disabled]="busy() || (extendBy() === 'date' && !until())" (click)="extend()" data-testid="extend-apply">{{ c.blocked ? ('Apply and restore access' | tr) : ('Apply' | tr) }}</button>
              </mat-card-content></mat-card>

              <mat-card appearance="outlined"><mat-card-content class="!p-4">
                <h3 class="m-0 text-sm font-semibold" i18n>Plan and price</h3>
                <p class="mb-3 mt-1 text-xs text-on-surface-variant" i18n>The price is frozen on the store when you set it. Editing the plan list later does not change it.</p>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic"><mat-label i18n>Plan</mat-label>
                  <mat-select [ngModel]="planKey()" (ngModelChange)="planKey.set($event)" data-testid="plan-select">@for (p of plans(); track p.key) { <mat-option [value]="p.key">{{ p.name }} @if (p.monthlyPrice != null) { · {{ p.monthlyPrice | currency: p.currency }} } @else { · <span i18n>by agreement</span> }</mat-option> }</mat-select></mat-form-field>
                <mat-form-field appearance="outline" class="mt-3 w-full" subscriptSizing="dynamic"><mat-label>{{ priceRequired() ? ('Agreed price per ' + (c.interval === 'YEAR' ? 'year' : 'month') + ' (required)') : ('Override the price (optional)') }}</mat-label><input matInput type="number" min="0" step="0.01" [ngModel]="customAmount()" (ngModelChange)="customAmount.set($event === '' || $event === null ? null : +$event)" data-testid="plan-price" /></mat-form-field>
                <button mat-flat-button color="primary" class="!mt-3" [disabled]="busy() || planKey() === c.planKey && customAmount() == null || priceRequired() && customAmount() == null" (click)="changePlan()" data-testid="plan-apply" i18n>Apply plan</button>
              </mat-card-content></mat-card>

              <mat-card appearance="outlined"><mat-card-content class="!p-4">
                <h3 class="m-0 text-sm font-semibold" i18n>Status</h3>
                <p class="mb-3 mt-1 text-xs text-on-surface-variant" i18n>Suspend or cancel a store, or put it back. To reopen a store that ran out of time, extend it instead.</p>
                <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic"><mat-label i18n>Move to</mat-label>
                  <mat-select [ngModel]="newStatus()" (ngModelChange)="newStatus.set($event)" data-testid="status-select">@for (s of statuses; track s.value) { <mat-option [value]="s.value" [disabled]="s.value === c.status">{{ s.label }}</mat-option> }</mat-select></mat-form-field>
                <button mat-flat-button [color]="isLocking() ? 'warn' : 'primary'" class="!mt-3" [disabled]="busy() || !newStatus()" (click)="setStatus()" data-testid="status-apply" i18n>Change status</button>
              </mat-card-content></mat-card>

              <mat-card appearance="outlined"><mat-card-content class="!p-4">
                <h3 class="m-0 text-sm font-semibold" i18n>Modules</h3>
                <p class="mb-2 mt-1 text-xs text-on-surface-variant" i18n>Every module is included in every plan. Switching them costs nothing.</p>
                <div class="flex flex-col">@for (m of modules; track m.key) { <mat-checkbox [checked]="chosen().includes(m.key)" (change)="toggle(m.key, $event.checked)" [attr.data-testid]="'mod-' + m.key">{{ m.label }}</mat-checkbox> }</div>
                <button mat-stroked-button class="!mt-2" [disabled]="busy() || !chosen().length" (click)="saveModules()" data-testid="modules-save" i18n>Save modules</button>
              </mat-card-content></mat-card>
            }
          </div>
        </mat-tab>

        <mat-tab [label]="'Members (' + c.seatCount + ')'">
          <mat-card appearance="outlined" class="my-4"><mat-card-content class="!p-0">
            @for (m of d.members; track m.id) { <div class="flex items-center gap-3 border-t border-outline-variant px-4 py-2 first:border-t-0"><mat-icon class="text-on-surface-variant">person</mat-icon><div class="min-w-0 flex-1"><div class="truncate text-sm font-medium">{{ m.name }}</div><div class="truncate text-xs text-on-surface-variant">{{ m.email }}</div></div><span class="text-xs text-on-surface-variant">{{ m.role }}</span><span class="rounded-full bg-surface-container-high px-2 py-0.5 text-xs">{{ m.status }}</span></div> } @empty { <p class="p-4 text-sm text-on-surface-variant" i18n>No members.</p> }
          </mat-card-content></mat-card>
        </mat-tab>

        <mat-tab label="Invoices" i18n-label>
          <div class="flex items-center justify-between py-3"><span class="text-sm text-on-surface-variant">{{ d.invoices.length }} <span i18n>invoices</span></span>
            @if (d.subscription) { <button mat-stroked-button [disabled]="busy()" (click)="raiseInvoice()" data-testid="raise-invoice"><mat-icon>add</mat-icon><span i18n>Raise an invoice</span></button> }</div>
          <mat-card appearance="outlined" class="mb-4 overflow-x-auto"><table class="w-full min-w-[640px] text-sm">
            <thead class="text-left text-xs uppercase text-on-surface-variant"><tr><th class="p-3" i18n>Number</th><th class="p-3" i18n>Period</th><th class="p-3" i18n>Due</th><th class="p-3 text-right" i18n>Total</th><th class="p-3 text-right" i18n>Owing</th><th class="p-3" i18n>Status</th></tr></thead>
            <tbody>@for (i of d.invoices; track i._id) { <tr class="border-t border-outline-variant hover:bg-surface-container-low"><td class="p-3"><a [routerLink]="['../../invoices', i._id]" class="font-medium text-primary">{{ i.invoiceNumber }}</a></td><td class="p-3">{{ i.billingPeriodStart | date: 'mediumDate' : 'UTC' }} – {{ i.billingPeriodEnd | date: 'mediumDate' : 'UTC' }}</td><td class="p-3">{{ i.dueDate | date: 'mediumDate' : 'UTC' }}</td><td class="p-3 text-right tabular-nums">{{ i.total ?? i.amount | currency: i.currency }}</td><td class="p-3 text-right tabular-nums">{{ i.amountDue | currency: i.currency }}</td><td class="p-3"><app-status-pill kind="invoice" [value]="i.status" /></td></tr> } @empty { <tr><td colspan="6" class="p-6 text-center text-on-surface-variant" i18n>No invoices yet.</td></tr> }</tbody></table></mat-card>
        </mat-tab>

        <mat-tab label="Activity" i18n-label>
          <mat-card appearance="outlined" class="my-4"><mat-card-content class="!p-0">
            @for (a of d.audit; track a._id) { <div class="flex items-start gap-3 border-t border-outline-variant px-4 py-2 text-sm first:border-t-0"><mat-icon class="mt-0.5 text-on-surface-variant">history</mat-icon><div class="min-w-0 flex-1"><div class="font-medium">{{ a.action }}</div><div class="text-xs text-on-surface-variant">{{ a.actorName || 'System' }}@if (a.reason) { · {{ a.reason }} }</div></div><span class="shrink-0 text-xs text-on-surface-variant">{{ a.createdAt | date: 'medium' }}</span></div> } @empty { <p class="p-4 text-sm text-on-surface-variant" i18n>No admin actions yet.</p> }
          </mat-card-content></mat-card>
        </mat-tab>
      </mat-tab-group>
    }
  `,
})
export class StoreDetailPage {
  private readonly api = inject(PlatformBillingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly storeId = this.route.snapshot.paramMap.get('storeId')!;
  readonly res = rxResource({ stream: () => this.api.adminStore(this.storeId) });
  readonly plansRes = rxResource({ stream: () => this.api.adminPlans() });
  readonly plans = computed(() => (this.plansRes.hasValue() ? this.plansRes.value().filter((p) => p.status === 'ACTIVE') : []));

  readonly busy = signal(false);
  readonly tab = signal(0);
  readonly modules = MODULES;
  readonly statuses: Array<{ value: SubStatus; label: string }> = [
    { value: 'TRIAL', label: $localize`On trial` }, { value: 'ACTIVE', label: $localize`Active` }, { value: 'PAST_DUE', label: $localize`Payment late` },
    { value: 'SUSPENDED', label: $localize`Suspended` }, { value: 'CANCELLED', label: $localize`Cancelled` }, { value: 'EXPIRED', label: $localize`Locked (expired)` },
  ];

  readonly extendBy = signal<number | 'date'>(1);
  readonly until = signal<Date | null>(null);
  readonly extendReason = signal('');
  readonly planKey = signal('');
  readonly customAmount = signal<number | null>(null);
  readonly newStatus = signal<SubStatus | ''>('');
  readonly chosen = signal<string[]>([]);

  constructor() {
    // Each time the store reloads, the form controls start from what the store has now.
    effect(() => {
      if (!this.res.hasValue()) return;
      const d = this.res.value();
      this.planKey.set(d.context.planKey ?? '');
      this.chosen.set([...d.modules]);
    });
  }

  readonly owed = computed(() => (this.res.hasValue() ? this.res.value().invoices.filter((i) => i.status === 'PENDING').reduce((s, i) => s + (i.amountDue ?? 0), 0) : 0));
  readonly history = computed(() => (this.res.hasValue() ? [...((this.res.value().subscription?.['statusHistory'] as any[]) ?? [])].reverse().slice(0, 12) : []));
  readonly priceRequired = computed(() => {
    const p = this.plans().find((x) => x.key === this.planKey());
    return !!p && (p.contactUsOnly || p.monthlyPrice == null);
  });
  readonly isLocking = computed(() => !!this.newStatus() && LOCKING.includes(this.newStatus() as SubStatus));
  readonly shortening = computed(() => {
    if (!this.res.hasValue() || !this.until()) return false;
    const end = this.res.value().context.currentPeriodEnd;
    return !!end && this.until()!.getTime() < new Date(end).getTime();
  });
  deadlineHint(): string {
    if (!this.res.hasValue()) return '';
    const c = this.res.value().context;
    if (c.daysRemaining == null || !c.status) return '';
    if (c.status === 'EXPIRED' || c.status === 'SUSPENDED' || c.status === 'CANCELLED') return '';
    const label = c.status === 'TRIAL' ? $localize`trial` : c.status === 'PAST_DUE' ? $localize`locks` : $localize`renews`;
    return c.daysRemaining < 0 ? $localize`${label} ${-c.daysRemaining} days ago` : $localize`${label} in ${c.daysRemaining} days`;
  }
  moduleLabel = (key: string) => MODULES.find((m) => m.key === key)?.label ?? key;
  toggle(key: string, on: boolean): void {
    this.chosen.update((cur) => (on ? [...new Set([...cur, key])] : cur.filter((k) => k !== key)));
  }

  /** Runs one admin call, tells the person what happened, and reloads. A failure shows the server's own words. */
  private async act(call: Observable<unknown>, done: string): Promise<boolean> {
    this.busy.set(true);
    try {
      await firstValueFrom(call);
      this.snack.open(done, $localize`Close`, { duration: 3500 });
      this.res.reload();
      return true;
    } catch (e: any) {
      this.snack.open(e?.error?.message ?? $localize`That did not work. Please try again.`, $localize`Close`, { duration: 6000 });
      return false;
    } finally {
      this.busy.set(false);
    }
  }
  private confirm(data: { title: string; message: string; confirm: string; warn?: boolean; requireReason?: boolean }): Promise<string | true | undefined> {
    return firstValueFrom(this.dialog.open(ReasonDialogComponent, { data, width: '440px', maxWidth: '92vw' }).afterClosed());
  }

  extend(): void {
    const by = this.extendBy();
    const reason = this.extendReason().trim() || undefined;
    const body = by === 'date' ? { until: this.toDay(this.until()!), reason } : { months: by as number, reason };
    void this.act(this.api.adminExtend(this.storeId, body), $localize`Time added`);
  }
  private toDay(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  changePlan(): void {
    void this.act(this.api.adminChangePlan(this.storeId, { planKey: this.planKey(), customAmount: this.customAmount() }), $localize`Plan updated`).then((ok) => ok && this.customAmount.set(null));
  }
  async setStatus(): Promise<void> {
    const status = this.newStatus() as SubStatus;
    const answer = await this.confirm({
      title: this.isLocking() ? $localize`Lock this store?` : $localize`Change the status?`,
      message: this.isLocking() ? $localize`Nobody at this store will be able to use the system until it is restored.` : $localize`The store's status will change straight away.`,
      confirm: $localize`Change status`,
      warn: this.isLocking(),
      requireReason: this.isLocking(),
    });
    if (!answer) return;
    await this.act(this.api.adminSetStatus(this.storeId, status, typeof answer === 'string' ? answer : undefined), $localize`Status updated`);
    this.newStatus.set('');
  }
  saveModules(): void {
    void this.act(this.api.adminSetModules(this.storeId, this.chosen()), $localize`Modules saved`);
  }
  startTrial(): void {
    void this.act(this.api.adminStartTrial(this.storeId), $localize`Trial started`);
  }
  raiseInvoice(): void {
    void this.act(this.api.adminRaiseInvoice(this.storeId), $localize`Invoice raised`);
  }
}
