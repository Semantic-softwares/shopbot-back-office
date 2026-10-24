import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { debounceTime, map } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusPillComponent } from '../../../../shared/components/status-pill/status-pill.component';
import { AdminStoreRow } from '../../../../shared/models/platform-billing.model';
import { PlatformBillingService } from '../../../../shared/services/platform-billing.service';

@Component({
  selector: 'app-admin-stores',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule, MatSelectModule, MatTableModule, PageHeaderComponent, StatusPillComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Stores" i18n-title [subtitle]="count()" />

    <mat-card appearance="outlined" class="mb-3">
      <mat-card-content class="!p-3 sm:!p-4">
        <div class="grid grid-cols-1 gap-x-3 sm:grid-cols-3">
          <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label i18n>Search stores</mat-label><input matInput [ngModel]="search()" (ngModelChange)="search.set($event)" data-testid="store-search" /><mat-icon matSuffix>search</mat-icon></mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label i18n>Status</mat-label>
            <mat-select [ngModel]="status()" (ngModelChange)="setStatus($event)" data-testid="store-status">
              <mat-option value="" i18n>All</mat-option><mat-option value="TRIAL" i18n>On trial</mat-option><mat-option value="ACTIVE" i18n>Active</mat-option><mat-option value="PAST_DUE" i18n>Payment late</mat-option>
              <mat-option value="EXPIRED" i18n>Locked</mat-option><mat-option value="SUSPENDED" i18n>Suspended</mat-option><mat-option value="CANCELLED" i18n>Cancelled</mat-option><mat-option value="NONE" i18n>No subscription</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label i18n>Needs attention</mat-label>
            <mat-select [ngModel]="attention()" (ngModelChange)="attention.set($event)">
              <mat-option value="" i18n>Everything</mat-option><mat-option value="locked" i18n>Locked out</mat-option><mat-option value="owes" i18n>Owes money</mat-option><mat-option value="overCap" i18n>Over their seats</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card-content>
    </mat-card>

    @if (res.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
    @if (res.error() && !res.hasValue()) {
      <div class="rounded-3xl border border-outline-variant p-8 text-center" role="alert"><p class="m-0 font-semibold" i18n>Could not load the stores.</p><button mat-flat-button class="!mt-3" (click)="res.reload()" i18n>Try again</button></div>
    } @else if (res.hasValue()) {
      @if (truncated()) { <p class="mb-2 text-sm text-on-surface-variant" i18n>Showing the newest stores. Search to find a specific one.</p> }
      @if (!rows().length) {
        <mat-card appearance="outlined"><mat-card-content class="!p-10 text-center text-on-surface-variant" i18n>No stores match.</mat-card-content></mat-card>
      } @else {
        <mat-card appearance="outlined" class="overflow-x-auto max-md:!hidden">
          <table mat-table [dataSource]="rows()" class="w-full min-w-[860px]" data-testid="stores-table">
            <ng-container matColumnDef="store"><th mat-header-cell *matHeaderCellDef i18n>Store</th>
              <td mat-cell *matCellDef="let r"><a [routerLink]="[r.storeId]" class="font-medium text-inherit hover:underline">{{ r.name }}</a><div class="text-xs text-on-surface-variant">{{ r.email || '—' }}</div></td></ng-container>
            <ng-container matColumnDef="plan"><th mat-header-cell *matHeaderCellDef i18n>Plan</th>
              <td mat-cell *matCellDef="let r">@if (r.planKey) { <span class="capitalize">{{ r.planKey }}</span><div class="text-xs text-on-surface-variant tabular-nums">@if (r.amount > 0) { {{ r.amount | currency: r.currency || 'USD' : 'symbol' : '1.0-2' }} / {{ r.interval === 'YEAR' ? 'yr' : 'mo' }} } @else { <span i18n>no charge</span> }</div> } @else { — }</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef i18n>Status</th>
              <td mat-cell *matCellDef="let r"><app-status-pill [value]="r.status" />@if (r.legacy) { <div class="mt-0.5 text-xs text-on-surface-variant" i18n>old billing</div> }</td></ng-container>
            <ng-container matColumnDef="seats"><th mat-header-cell *matHeaderCellDef class="!text-right" i18n>Seats</th>
              <td mat-cell *matCellDef="let r" class="text-right tabular-nums" [class.text-red-600]="r.overCap">{{ r.seats }}@if (r.seatCap) { / {{ r.seatCap }} }</td></ng-container>
            <ng-container matColumnDef="ends"><th mat-header-cell *matHeaderCellDef i18n>Until</th>
              <td mat-cell *matCellDef="let r">@if (r.status) { {{ r.status === 'TRIAL' ? (r.trialEndsAt | date: 'mediumDate' : 'UTC') : (r.currentPeriodEnd | date: 'mediumDate' : 'UTC') }}<div class="text-xs text-on-surface-variant">{{ daysLabel(r) }}</div> } @else { — }</td></ng-container>
            <ng-container matColumnDef="owes"><th mat-header-cell *matHeaderCellDef class="!text-right" i18n>Owes</th>
              <td mat-cell *matCellDef="let r" class="text-right tabular-nums" [class.text-amber-600]="r.outstanding > 0">{{ r.outstanding > 0 ? (r.outstanding | currency: r.currency || 'USD') : '—' }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let r; columns: columns" class="cursor-pointer hover:bg-surface-container-low" (click)="open(r)"></tr>
          </table>
        </mat-card>
        <div class="flex flex-col gap-3 md:hidden">
          @for (r of rows(); track r.storeId) {
            <a [routerLink]="[r.storeId]" class="text-inherit no-underline"><mat-card appearance="outlined"><mat-card-content class="!p-4">
              <div class="flex items-start justify-between gap-3"><div class="min-w-0"><div class="truncate font-semibold">{{ r.name }}</div><div class="truncate text-xs text-on-surface-variant">{{ r.email || '—' }}</div></div><app-status-pill [value]="r.status" /></div>
              <dl class="m-0 mt-3 grid grid-cols-3 gap-2 text-sm">
                <div><dt class="text-xs text-on-surface-variant" i18n>Plan</dt><dd class="m-0 capitalize">{{ r.planKey || '—' }}</dd></div>
                <div><dt class="text-xs text-on-surface-variant" i18n>Seats</dt><dd class="m-0 tabular-nums" [class.text-red-600]="r.overCap">{{ r.seats }}@if (r.seatCap) { / {{ r.seatCap }} }</dd></div>
                <div><dt class="text-xs text-on-surface-variant" i18n>Owes</dt><dd class="m-0 tabular-nums">{{ r.outstanding > 0 ? (r.outstanding | currency: r.currency || 'USD') : '—' }}</dd></div>
              </dl>
            </mat-card-content></mat-card></a>
          }
        </div>
      }
    }
  `,
})
export class StoresPage {
  private readonly api = inject(PlatformBillingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly columns = ['store', 'plan', 'status', 'seats', 'ends', 'owes'];

  readonly search = signal('');
  readonly status = signal(this.route.snapshot.queryParamMap.get('status') ?? '');
  readonly attention = signal('');
  /** Typing waits for a pause before it asks the server. */
  private readonly query = toSignal(toObservableSearch(this.search), { initialValue: '' });

  readonly res = rxResource({ params: () => ({ search: this.query() }), stream: ({ params }) => this.api.adminStores({ search: params.search, limit: 100 }) });

  readonly rows = computed<AdminStoreRow[]>(() => {
    if (!this.res.hasValue()) return [];
    const status = this.status();
    const att = this.attention();
    return this.res.value().rows.filter((r) => {
      if (status === 'NONE' ? r.status !== null : status && r.status !== status) return false;
      if (att === 'locked') return r.blocked;
      if (att === 'owes') return r.outstanding > 0;
      if (att === 'overCap') return r.overCap;
      return true;
    });
  });
  readonly truncated = computed(() => this.res.hasValue() && this.res.value().total > this.res.value().rows.length);
  readonly count = computed(() => (this.res.hasValue() ? $localize`${this.rows().length} of ${this.res.value().total} stores` : ''));

  setStatus(value: string): void {
    this.status.set(value);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { status: value || null }, queryParamsHandling: 'merge', replaceUrl: true });
  }
  open(r: AdminStoreRow): void {
    void this.router.navigate([r.storeId], { relativeTo: this.route });
  }
  daysLabel(r: AdminStoreRow): string {
    if (r.daysRemaining == null) return '';
    if (r.status === 'EXPIRED' || r.status === 'SUSPENDED' || r.status === 'CANCELLED') return '';
    if (r.daysRemaining < 0) return $localize`${-r.daysRemaining} days ago`;
    return r.daysRemaining === 0 ? $localize`today` : $localize`in ${r.daysRemaining} days`;
  }
}

function toObservableSearch(s: ReturnType<typeof signal<string>>) {
  return toObservable(s).pipe(debounceTime(300), map((v) => v.trim()));
}
