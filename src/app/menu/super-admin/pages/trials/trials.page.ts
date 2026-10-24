import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PlatformBillingService } from '../../../../shared/services/platform-billing.service';

@Component({
  selector: 'app-admin-trials',
  imports: [DatePipe, RouterLink, MatButtonModule, MatCardModule, MatProgressBarModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Trials" i18n-title subtitle="Stores still on their free trial, the soonest to end first" i18n-subtitle />
    @if (res.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
    @if (res.error() && !res.hasValue()) {
      <div class="rounded-3xl border border-outline-variant p-8 text-center" role="alert"><p class="m-0 font-semibold" i18n>Could not load the trials.</p><button mat-flat-button class="!mt-3" (click)="res.reload()" i18n>Try again</button></div>
    } @else if (res.hasValue()) {
      <mat-card appearance="outlined" class="overflow-x-auto"><table class="w-full min-w-[620px] text-sm" data-testid="trials-table">
        <thead class="text-left text-xs uppercase text-on-surface-variant"><tr><th class="p-3" i18n>Store</th><th class="p-3" i18n>Started</th><th class="p-3" i18n>Ends</th><th class="p-3" i18n>Left</th><th class="p-3"></th></tr></thead>
        <tbody>@for (t of res.value(); track t.storeId) {
          <tr class="border-t border-outline-variant"><td class="p-3"><div class="font-medium">{{ t.name }}</div><div class="text-xs text-on-surface-variant">{{ t.email }}</div></td><td class="p-3">{{ t.trialStartedAt | date: 'mediumDate' }}</td><td class="p-3">{{ t.trialEndsAt | date: 'mediumDate' }}</td>
            <td class="p-3"><span [class]="t.daysRemaining <= 3 ? 'font-semibold text-amber-700' : ''">{{ t.daysRemaining }} <span i18n>days</span></span></td><td class="p-3 text-right"><a mat-stroked-button [routerLink]="['../stores', t.storeId]" i18n>Open</a></td></tr>
        } @empty { <tr><td colspan="5" class="p-8 text-center text-on-surface-variant" i18n>No store is on a trial.</td></tr> }</tbody></table></mat-card>
    }
  `,
})
export class TrialsPage {
  private readonly api = inject(PlatformBillingService);
  readonly res = rxResource({ stream: () => this.api.adminTrials() });
}
