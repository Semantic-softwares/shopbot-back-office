import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BillingPlan } from '../../../../shared/models/platform-billing.model';
import { PlatformBillingService } from '../../../../shared/services/platform-billing.service';
import { PlanDialogComponent, ReasonDialogComponent } from '../../dialogs/admin-dialogs';

@Component({
  selector: 'app-admin-plans',
  imports: [CurrencyPipe, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Plans" i18n-title subtitle="Seat tiers. Every plan includes every module. Changing a price here never changes a store that already has one." i18n-subtitle />
    <div class="mb-4 flex justify-end"><button mat-flat-button color="primary" (click)="edit(null)" data-testid="plan-new"><mat-icon>add</mat-icon><span i18n>New plan</span></button></div>
    @if (res.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
    @if (res.error() && !res.hasValue()) {
      <div class="rounded-3xl border border-outline-variant p-8 text-center" role="alert"><p class="m-0 font-semibold" i18n>Could not load the plans.</p><button mat-flat-button class="!mt-3" (click)="res.reload()" i18n>Try again</button></div>
    } @else if (res.hasValue()) {
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="plans-grid">
        @for (p of res.value(); track p._id) {
          <mat-card appearance="outlined" class="h-full" [class.opacity-60]="p.status === 'ARCHIVED'"><mat-card-content class="flex h-full flex-col !p-5">
            <div class="flex items-center gap-2"><h3 class="m-0 text-lg font-bold">{{ p.name }}</h3>@if (p.status === 'ARCHIVED') { <span class="rounded-full bg-surface-container-high px-2 py-0.5 text-xs" i18n>archived</span> }</div>
            <div class="mt-2 text-2xl font-bold tabular-nums">@if (p.monthlyPrice != null) { {{ p.monthlyPrice | currency: p.currency : 'symbol' : '1.0-2' }}<span class="text-sm font-normal text-on-surface-variant"> / <span i18n>month</span></span> } @else { <span class="text-base" i18n>By agreement</span> }</div>
            @if (p.yearlyPrice != null) { <div class="text-xs text-on-surface-variant tabular-nums">{{ p.yearlyPrice | currency: p.currency : 'symbol' : '1.0-2' }} / <span i18n>year</span></div> }
            <div class="mt-2 text-sm">{{ p.minSeats }}–{{ p.maxSeats ?? '∞' }} <span i18n>seats</span></div>
            @if (p.description) { <p class="mb-0 mt-2 text-sm text-on-surface-variant">{{ p.description }}</p> }
            <div class="mt-auto flex gap-2 pt-4"><button mat-stroked-button (click)="edit(p)" [attr.data-testid]="'plan-edit-' + p.key" i18n>Edit</button>@if (p.status === 'ACTIVE') { <button mat-button (click)="archive(p)" i18n>Archive</button> }</div>
          </mat-card-content></mat-card>
        }
      </div>
    }
  `,
})
export class PlansPage {
  private readonly api = inject(PlatformBillingService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  readonly res = rxResource({ stream: () => this.api.adminPlans() });

  async edit(plan: BillingPlan | null): Promise<void> {
    const body = await firstValueFrom(this.dialog.open(PlanDialogComponent, { data: plan, width: '560px', maxWidth: '94vw' }).afterClosed());
    if (!body) return;
    try {
      await firstValueFrom(plan ? this.api.adminUpdatePlan(plan.key, body) : this.api.adminCreatePlan(body));
      this.snack.open($localize`Plan saved`, $localize`Close`, { duration: 3000 });
      this.res.reload();
    } catch (e: any) {
      this.snack.open(e?.error?.message ?? $localize`That did not work. Please try again.`, $localize`Close`, { duration: 6000 });
    }
  }
  async archive(plan: BillingPlan): Promise<void> {
    const ok = await firstValueFrom(this.dialog.open(ReasonDialogComponent, { data: { title: $localize`Archive ${plan.name}?`, message: $localize`New stores can no longer pick it. Stores already on it keep it.`, confirm: $localize`Archive`, warn: true }, width: '440px', maxWidth: '92vw' }).afterClosed());
    if (!ok) return;
    try {
      await firstValueFrom(this.api.adminArchivePlan(plan.key));
      this.res.reload();
    } catch (e: any) {
      this.snack.open(e?.error?.message ?? $localize`That did not work. Please try again.`, $localize`Close`, { duration: 6000 });
    }
  }
}
