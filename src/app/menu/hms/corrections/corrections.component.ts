import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { HistoricalCorrection, HistoricalCorrectionService } from '../../../shared/services/historical-correction.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { CorrectionDialogComponent, correctionTone, personName, statusLabel } from './correction-dialog';

const FILTERS = [
  { value: 'all', label: $localize`All` },
  { value: 'PENDING_REVIEW', label: $localize`Pending review` },
  { value: 'FAILED', label: $localize`Failed` },
  { value: 'COMPLETED', label: $localize`Completed` },
  { value: 'REJECTED', label: $localize`Rejected` },
];

/**
 * Stays entered for days night audit had already closed. Each case waits here for a manager; approving posts the missing charges
 * onto the open day. The closed days themselves are never edited.
 */
@Component({
  selector: 'app-corrections',
  imports: [CurrencyPipe, DatePipe, PageHeaderComponent, MatButtonModule, MatChipsModule, MatDialogModule, MatIconModule, MatPaginatorModule, MatProgressBarModule, MatTableModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './corrections.component.html',
})
export class CorrectionsComponent {
  private readonly api = inject(HistoricalCorrectionService);
  private readonly storeStore = inject(StoreStore);
  private readonly dialog = inject(MatDialog);

  readonly filters = FILTERS;
  readonly status = signal('all');
  readonly page = signal(1);
  readonly pageSize = 20;
  private readonly refresh = signal(0);
  readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  readonly currency = computed(() => this.storeStore.selectedStore()?.currency ?? '');
  readonly columns = ['reservation', 'nights', 'amount', 'reason', 'raised', 'status', 'go'];
  readonly tone = correctionTone;
  readonly statusText = statusLabel;
  readonly person = personName;

  private readonly res = rxResource({
    params: () => ({ id: this.storeId(), status: this.status(), page: this.page(), n: this.refresh() }),
    stream: ({ params }) => (params.id ? this.api.list(params.id, { status: params.status, page: params.page, limit: this.pageSize }) : of(null)),
  });
  readonly data = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly rows = computed(() => this.data()?.rows ?? []);
  readonly loading = computed(() => this.res.isLoading());
  readonly failed = computed(() => !!this.res.error() && !this.data());

  setStatus(value: string | null) { this.status.set(value ?? 'all'); this.page.set(1); }
  onPage(e: PageEvent) { this.page.set(e.pageIndex + 1); }
  reload() { this.refresh.update((n) => n + 1); }

  range(c: HistoricalCorrection): string {
    const nights = [...(c.affectedBusinessDates ?? [])].sort();
    if (!nights.length) return '—';
    const fmt = (n: string) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(new Date(n + 'T12:00:00'));
    return nights.length === 1 ? fmt(nights[0]) : `${fmt(nights[0])} – ${fmt(nights[nights.length - 1])} (${nights.length})`;
  }

  /** One case on screen at a time; it loads its own detail and refreshes this list when something was decided. */
  open(c: HistoricalCorrection) {
    if (this.dialog.getDialogById('correction')) return;
    this.dialog
      .open(CorrectionDialogComponent, { id: 'correction', width: '640px', maxWidth: '96vw', data: { correction: c, storeId: this.storeId(), currency: this.currency() } })
      .afterClosed()
      .subscribe((changed) => { if (changed) this.reload(); });
  }
}
