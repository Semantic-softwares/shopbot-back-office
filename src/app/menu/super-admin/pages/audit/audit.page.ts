import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PlatformBillingService } from '../../../../shared/services/platform-billing.service';

@Component({
  selector: 'app-admin-audit',
  imports: [DatePipe, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-page-header title="Audit log" i18n-title subtitle="Everything an administrator changed, and why" i18n-subtitle />
    @if (res.isLoading()) { <mat-progress-bar mode="indeterminate" /> }
    @if (res.error() && !res.hasValue()) {
      <div class="rounded-3xl border border-outline-variant p-8 text-center" role="alert"><p class="m-0 font-semibold" i18n>Could not load the log.</p><button mat-flat-button class="!mt-3" (click)="res.reload()" i18n>Try again</button></div>
    } @else if (res.hasValue()) {
      <mat-card appearance="outlined"><mat-card-content class="!p-0" data-testid="audit-list">
        @for (a of res.value().rows; track a._id) {
          <div class="flex items-start gap-3 border-t border-outline-variant px-4 py-3 text-sm first:border-t-0"><mat-icon class="mt-0.5 text-on-surface-variant">history</mat-icon>
            <div class="min-w-0 flex-1"><div class="font-medium">{{ a.action }} @if (a.storeId) { <a [routerLink]="['../stores', a.storeId]" class="font-normal text-primary">{{ a.storeName || 'store' }}</a> }</div>
              <div class="text-xs text-on-surface-variant">{{ a.actorName || 'System' }}@if (a.reason) { · {{ a.reason }} }</div></div>
            <span class="shrink-0 text-xs text-on-surface-variant">{{ a.createdAt | date: 'medium' }}</span></div>
        } @empty { <p class="p-8 text-center text-on-surface-variant" i18n>Nothing has been changed yet.</p> }
      </mat-card-content></mat-card>
      <div class="mt-3 flex items-center justify-end gap-2 text-sm"><span class="text-on-surface-variant">{{ res.value().total }} <span i18n>entries</span></span>
        <button mat-stroked-button [disabled]="page() <= 1" (click)="page.set(page() - 1)" i18n>Previous</button><button mat-stroked-button [disabled]="page() * 30 >= res.value().total" (click)="page.set(page() + 1)" i18n>Next</button></div>
    }
  `,
})
export class AuditPage {
  private readonly api = inject(PlatformBillingService);
  readonly page = signal(1);
  readonly res = rxResource({ params: () => this.page(), stream: ({ params }) => this.api.adminAudit({ page: params, limit: 30 }) });
}
