import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { RegisterReportComponent } from '../../../../shared/register/components/register-report.component';
import { MinorPipe } from '../../../../shared/register/minor.pipe';
import { RegisterApiService } from '../../../../shared/register/register-api.service';
import { buildReportHtml } from '../../../../shared/register/register-report-print';
import { RegisterReport, SessionReconciliation } from '../../../../shared/register/register.models';
import { RolesService } from '../../../../shared/services/roles.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { chipTone, reconciliationLabel, reconciliationTone, sessionStatusLabel, sessionTone, varianceTone } from '../sales-common';

/**
 * One register session in full: the report as it stands (X) or as it was closed (Z), who worked the register and when, the
 * reconciliation (what arrived late, whether every till has reported), and the audit trail. Nothing here can change a closed
 * session except a manager marking it reconciled.
 */
@Component({
  selector: 'app-session-detail',
  imports: [CurrencyPipe, DatePipe, MinorPipe, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule, PageHeaderComponent, RegisterReportComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="px-2 pb-16 md:px-4">
      <app-page-header [title]="title()" subtitle="Register session" i18n-subtitle>
        <div actions class="flex items-center gap-2">
          <a mat-stroked-button routerLink="/menu/erp/sales/sessions"><mat-icon>arrow_back</mat-icon><ng-container i18n>All sessions</ng-container></a>
          <button mat-flat-button color="primary" [disabled]="!report.hasValue()" (click)="print()" data-testid="detail-print"><mat-icon>print</mat-icon><ng-container i18n>Print</ng-container></button>
        </div>
      </app-page-header>

      @if (detail.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
      @if (detail.error() && !detail.hasValue()) {
        <div class="mt-4 flex flex-col items-center gap-2 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-900" role="alert">
          <mat-icon class="!h-10 !w-10 !text-4xl !leading-none text-red-600">error</mat-icon>
          <p class="m-0 font-semibold"><ng-container i18n>You cannot open this session.</ng-container></p>
        </div>
      } @else if (detail.hasValue()) {
        @let s = detail.value().session;
        <div class="mt-4 flex flex-col gap-4">
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="rounded-full px-2 py-0.5 text-xs font-medium" [class]="tone(sessionTone(s.status))" data-testid="detail-status">{{ statusLabel(s.status) }}</span>
            @if (s.status === 'closed') { <span class="rounded-full px-2 py-0.5 text-xs font-medium" [class]="tone(reconTone(s.reconciliationStatus))" data-testid="detail-reconciliation">{{ reconLabel(s.reconciliationStatus) }}</span> }
            <span class="text-on-surface-variant"><ng-container i18n>Opened</ng-container> {{ s.openedAt | date: 'medium' }}@if (s.closedAt) { · <ng-container i18n>Closed</ng-container> {{ s.closedAt | date: 'medium' }} }</span>
          </div>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <mat-card appearance="outlined"><mat-card-content class="!p-4">
              @if (report.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
              <app-register-report [report]="reportValue()" />
            </mat-card-content></mat-card>

            <div class="flex flex-col gap-4">
              <mat-card appearance="outlined"><mat-card-content class="!p-4">
                <h3 class="m-0 mb-2 text-xs font-medium uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Who worked this register</ng-container></h3>
                <ul class="m-0 list-none p-0 text-sm" data-testid="detail-cashiers">
                  @for (a of assignments(); track a._id) {
                    <li class="flex items-start justify-between gap-3 border-b border-outline-variant py-2 last:border-0">
                      <span><span class="font-medium">{{ a.cashierId.name || '—' }}</span><span class="block text-xs text-on-surface-variant">{{ how(a.startedBy) }}@if (a.handoverNotes) { · {{ a.handoverNotes }} }</span></span>
                      <span class="shrink-0 text-xs text-on-surface-variant">{{ a.startedAt | date: 'shortTime' }} → @if (a.endedAt) { {{ a.endedAt | date: 'shortTime' }} } @else { <ng-container i18n>now</ng-container> }</span>
                    </li>
                  }
                </ul>
              </mat-card-content></mat-card>

              @if (s.status === 'closed') {
                <mat-card appearance="outlined"><mat-card-content class="!p-4" data-testid="detail-recon-card">
                  <h3 class="m-0 mb-2 text-xs font-medium uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Reconciliation</ng-container></h3>
                  @if (recon.value(); as r) {
                    @if (r.z) {
                      <div class="flex items-center justify-between py-0.5 text-sm"><span><ng-container i18n>Expected at close</ng-container></span><span class="tabular-nums">{{ r.z.expectedCashMinor | minor: s.exponent | currency: symbol() : 'symbol' : digits() }}</span></div>
                      <div class="flex items-center justify-between py-0.5 text-sm"><span><ng-container i18n>Counted</ng-container></span><span class="tabular-nums">{{ r.z.actualCashMinor | minor: s.exponent | currency: symbol() : 'symbol' : digits() }}</span></div>
                    }
                    @if (r.lateEntries.length) {
                      <p class="m-0 mt-2 text-sm font-medium" data-testid="detail-late"><ng-container i18n>Arrived after the close</ng-container></p>
                      @for (l of r.lateEntries; track l.entryId) { <div class="flex items-center justify-between py-0.5 text-sm"><span>{{ l.kind }}@if (l.timeSuspect) { <span class="text-xs text-error"> · <ng-container i18n>time looks wrong</ng-container></span> }</span><span class="tabular-nums">{{ l.cashMinor | minor: s.exponent | currency: symbol() : 'symbol' : digits() }}</span></div> }
                      @if (r.adjusted) {
                        <div class="mt-1 flex items-center justify-between border-t border-outline-variant pt-1 text-sm font-medium"><span><ng-container i18n>With these, it should have held</ng-container></span><span class="tabular-nums">{{ r.adjusted.expectedCashMinor | minor: s.exponent | currency: symbol() : 'symbol' : digits() }}</span></div>
                        <div class="flex items-center justify-between text-sm font-medium"><span><ng-container i18n>Difference then</ng-container></span><span class="rounded-full px-2 py-0.5 text-xs" [class]="tone(varianceTone(r.adjusted.varianceMinor))">{{ r.adjusted.varianceMinor | minor: s.exponent | currency: symbol() : 'symbol' : digits() }}</span></div>
                      }
                    }
                    @if (!r.completeness.complete) { <p class="m-0 mt-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900" data-testid="detail-incomplete"><ng-container i18n>A till still has records to send for this session.</ng-container></p> }
                    @if (canReconcile() && s.reconciliationStatus !== 'reconciled') {
                      <button mat-flat-button color="primary" class="mt-3" [disabled]="busy() || !r.completeness.complete" (click)="reconcile()" data-testid="detail-reconcile"><mat-icon>task_alt</mat-icon><ng-container i18n>Mark as reconciled</ng-container></button>
                    }
                  }
                </mat-card-content></mat-card>
              }

              @if (auditRows().length) {
                <mat-card appearance="outlined"><mat-card-content class="!p-4">
                  <h3 class="m-0 mb-2 text-xs font-medium uppercase tracking-wide text-on-surface-variant"><ng-container i18n>Audit trail</ng-container></h3>
                  <ul class="m-0 max-h-72 list-none overflow-y-auto p-0 text-sm" data-testid="detail-audit">
                    @for (e of auditRows(); track e._id) { <li class="flex justify-between gap-3 border-b border-outline-variant py-1 last:border-0"><span>{{ e.action.replaceAll('_', ' ') }}@if (e.reason) { <span class="text-on-surface-variant"> · {{ e.reason }}</span> }</span><span class="shrink-0 text-xs text-on-surface-variant">{{ e.at | date: 'short' }}</span></li> }
                  </ul>
                </mat-card-content></mat-card>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class SessionDetailComponent {
  private readonly api = inject(RegisterApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly roles = inject(RolesService);
  private readonly snack = inject(MatSnackBar);
  readonly storeStore = inject(StoreStore);

  readonly statusLabel = sessionStatusLabel;
  readonly reconLabel = reconciliationLabel;
  readonly reconTone = reconciliationTone;
  readonly sessionTone = sessionTone;
  readonly varianceTone = varianceTone;
  readonly tone = chipTone;
  busy = signal(false);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  symbol = computed(() => this.storeStore.selectedStore()?.currency || '');
  digits = () => '1.2-2';

  readonly detail = rxResource({ params: () => ({ id: this.id }), stream: ({ params }) => this.api.sessionDetail(params.id) });
  readonly report = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, session: this.detail.hasValue() ? this.detail.value().session : null }),
    stream: ({ params }) => (params.storeId && params.session ? (params.session.status === 'closed' ? this.api.zReport(params.storeId, params.session._id) : this.api.xReport(params.storeId, params.session._id)) : of(null as RegisterReport | null)),
  });
  readonly recon = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id, session: this.detail.hasValue() ? this.detail.value().session : null }),
    stream: ({ params }) => (params.storeId && params.session?.status === 'closed' ? this.api.reconciliationOf(params.storeId, params.session._id) : of(null as SessionReconciliation | null)),
  });

  reportValue = computed<RegisterReport | null>(() => (this.report.hasValue() ? this.report.value() : null));
  assignments = computed(() => (this.detail.hasValue() ? (this.detail.value().assignments as { _id: string; cashierId: { name: string }; startedAt: string; endedAt?: string; startedBy: string; handoverNotes?: string }[]) : []));
  auditRows = computed(() => (this.detail.hasValue() ? ((this.detail.value().audit ?? []) as { _id: string; action: string; reason?: string; at: string }[]) : []));
  canReconcile = computed(() => this.roles.isAdmin() || this.roles.has('pos.register.reconcile'));
  title = computed(() => {
    const r = this.detail.hasValue() ? (this.detail.value().session.registerId as { name?: string }) : null;
    return r?.name ? `${r.name}` : $localize`Register session`;
  });

  how(startedBy: string): string {
    return startedBy === 'handover' ? $localize`Took over` : startedBy === 'join' ? $localize`Joined` : startedBy === 'switch' ? $localize`Switched in with a PIN` : $localize`Opened the register`;
  }

  print(): void {
    const r = this.reportValue();
    if (!r) return;
    const store = this.storeStore.selectedStore();
    const html = buildReportHtml({ ...r, store: { ...r.store, name: r.store?.name ?? store?.name } }, { symbol: store?.currency || '', exponent: r.session?.exponent ?? 2 });
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return void this.snack.open($localize`Allow pop-ups to print the report.`, $localize`Close`, { duration: 4000 });
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }

  reconcile(): void {
    const storeId = this.storeStore.selectedStore()?._id;
    if (!storeId) return;
    this.busy.set(true);
    this.api.reconcile(storeId, this.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.snack.open($localize`Marked as reconciled`, $localize`Close`, { duration: 3000 });
        this.detail.reload();
        this.recon.reload();
      },
      error: (err) => {
        this.busy.set(false);
        this.snack.open(err?.error?.message ?? $localize`Could not mark it as reconciled.`, $localize`Close`, { duration: 5000 });
      },
    });
  }
}
