import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { UpgradeRequestRow } from '../../../../shared/models/platform-billing.model';
import { PlatformBillingService } from '../../../../shared/services/platform-billing.service';
import { ReasonDialogComponent } from '../../dialogs/admin-dialogs';

@Component({
  selector: 'app-admin-requests',
  imports: [DatePipe, RouterLink, MatButtonModule, MatButtonToggleModule, MatCardModule, MatProgressBarModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Plan requests" i18n-title subtitle="Stores asking for a plan you set by agreement" i18n-subtitle />
    <mat-button-toggle-group class="mb-3" [value]="status()" (change)="status.set($event.value)" aria-label="Status"><mat-button-toggle value="OPEN" i18n>Open</mat-button-toggle><mat-button-toggle value="APPLIED" i18n>Done</mat-button-toggle><mat-button-toggle value="DECLINED" i18n>Declined</mat-button-toggle></mat-button-toggle-group>
    @if (res.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
    @if (res.error() && !res.hasValue()) {
      <div class="rounded-3xl border border-outline-variant p-8 text-center" role="alert"><p class="m-0 font-semibold" i18n>Could not load the requests.</p><button mat-flat-button class="!mt-3" (click)="res.reload()" i18n>Try again</button></div>
    } @else if (res.hasValue()) {
      <div class="flex flex-col gap-3" data-testid="requests-list">
        @for (r of res.value(); track r._id) {
          <mat-card appearance="outlined"><mat-card-content class="!p-4"><div class="flex flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1"><div class="font-semibold">{{ storeName(r) }}</div>
              <div class="text-sm text-on-surface-variant"><span i18n>wants</span> <b class="capitalize">{{ r.requestedPlanKey }}</b>@if (r.currentPlanKey) { · <span i18n>now on</span> <span class="capitalize">{{ r.currentPlanKey }}</span> } · {{ r.createdAt | date: 'mediumDate' }}</div>
              @if (r.requestedBy?.email) { <div class="text-xs text-on-surface-variant">{{ r.requestedBy?.name }} {{ r.requestedBy?.email }}</div> }
              @if (r.note) { <p class="mb-0 mt-2 text-sm">{{ r.note }}</p> }</div>
            <a mat-stroked-button [routerLink]="['../stores', storeId(r)]" i18n>Open store</a>
            @if (r.status === 'OPEN') { <button mat-flat-button color="primary" (click)="resolve(r, 'APPLIED')" data-testid="req-done" i18n>Mark done</button><button mat-stroked-button (click)="resolve(r, 'DECLINED')" i18n>Decline</button> }
          </div></mat-card-content></mat-card>
        } @empty { <mat-card appearance="outlined"><mat-card-content class="!p-10 text-center text-on-surface-variant" i18n>Nothing here.</mat-card-content></mat-card> }
      </div>
    }
  `,
})
export class RequestsPage {
  private readonly api = inject(PlatformBillingService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  readonly status = signal('OPEN');
  readonly res = rxResource({ params: () => this.status(), stream: ({ params }) => this.api.adminRequests(params) });
  storeName = (r: UpgradeRequestRow) => (typeof r.storeId === 'object' ? r.storeId.name : r.storeId);
  storeId = (r: UpgradeRequestRow) => (typeof r.storeId === 'object' ? r.storeId._id : r.storeId);
  async resolve(r: UpgradeRequestRow, outcome: 'APPLIED' | 'DECLINED'): Promise<void> {
    const note = await firstValueFrom(this.dialog.open(ReasonDialogComponent, { data: { title: outcome === 'APPLIED' ? $localize`Mark this request done?` : $localize`Decline this request?`, message: $localize`The store is not told automatically. Add a note for the record.`, confirm: outcome === 'APPLIED' ? $localize`Mark done` : $localize`Decline`, warn: outcome === 'DECLINED' }, width: '440px', maxWidth: '92vw' }).afterClosed());
    if (!note) return;
    try {
      await firstValueFrom(this.api.adminResolveRequest(r._id, outcome, typeof note === 'string' ? note : undefined));
      this.res.reload();
    } catch (e: any) {
      this.snack.open(e?.error?.message ?? $localize`That did not work. Please try again.`, $localize`Close`, { duration: 6000 });
    }
  }
}
