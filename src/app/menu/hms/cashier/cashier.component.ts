import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CashierService, CashierShift } from '../../../shared/services/cashier.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StoreStore } from '../../../shared/stores/store.store';
import { CashierCloseDialogComponent, CashierDropDialogComponent } from './cashier-dialogs';

@Component({
  selector: 'app-cashier',
  imports: [CurrencyPipe, DatePipe, FormsModule, PageHeaderComponent, MatButtonModule, MatCardModule, MatChipsModule, MatTableModule, MatTooltipModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule, MatSnackBarModule],
  templateUrl: './cashier.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class CashierComponent {
  private api = inject(CashierService);
  private storeStore = inject(StoreStore);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  private refresh = signal(0);
  storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  currency = computed(() => this.storeStore.selectedStore()?.currency ?? '');
  busy = signal(false);
  openingFloat = 0;
  /** The shift just closed, so its count can be shown against the system's figure. */
  justClosed = signal<CashierShift | null>(null);

  private currentRes = rxResource({
    params: () => ({ id: this.storeId(), n: this.refresh() }),
    stream: ({ params }) => (params.id ? this.api.current(params.id) : of(null)),
  });
  private listRes = rxResource({
    params: () => ({ id: this.storeId(), n: this.refresh() }),
    stream: ({ params }) => (params.id ? this.api.list(params.id) : of([] as CashierShift[])),
  });

  current = computed(() => (this.currentRes.hasValue() ? this.currentRes.value() : null));
  shift = computed(() => this.current()?.shift ?? null);
  summary = computed(() => this.current()?.summary ?? null);
  shifts = computed(() => (this.listRes.hasValue() ? (this.listRes.value() ?? []) : []));
  loading = computed(() => this.currentRes.isLoading() && !this.current());
  failed = computed(() => !!this.currentRes.error() && !this.current());
  dropsTotal = computed(() => (this.shift()?.drops ?? []).reduce((s, d) => s + d.amount, 0));
  cashTaken = computed(() => this.summary()?.totalsByMethod?.['cash'] ?? 0);
  allTaken = computed(() => Object.values(this.summary()?.totalsByMethod ?? {}).reduce((s, v) => s + v, 0));

  readonly columns = ['opened', 'closed', 'float', 'counted', 'expected', 'variance'];
  methods = computed(() => Object.entries(this.summary()?.totalsByMethod ?? {}).map(([key, value]) => ({ key, value })));
  tiles = computed(() => [
    { label: $localize`Opening float`, value: this.shift()?.openingFloat ?? 0 },
    { label: $localize`Cash taken`, value: this.cashTaken() },
    { label: $localize`Dropped to the safe`, value: this.dropsTotal() },
    { label: $localize`All payments taken`, value: this.allTaken() },
  ]);

  reload() {
    this.refresh.update((n) => n + 1);
  }

  private fail(error: any, fallback: string) {
    this.snack.open(error?.error?.message || fallback, $localize`Close`, { duration: 6000, panelClass: ['error-snackbar'] });
  }

  async open() {
    this.busy.set(true);
    this.justClosed.set(null);
    try {
      await firstValueFrom(this.api.open(this.storeId(), this.openingFloat || 0));
      this.openingFloat = 0;
    } catch (error) {
      this.fail(error, $localize`The shift could not be opened.`);
    } finally {
      this.busy.set(false);
      this.reload();
    }
  }

  async drop() {
    const shift = this.shift();
    if (!shift) return;
    const result = await firstValueFrom(this.dialog.open(CashierDropDialogComponent, { width: '420px', maxWidth: '92vw' }).afterClosed());
    if (!result) return;
    try {
      await firstValueFrom(this.api.drop(this.storeId(), shift._id, result.amount, result.note));
      this.snack.open($localize`Drop recorded`, $localize`Close`, { duration: 3000 });
    } catch (error) {
      this.fail(error, $localize`The drop could not be recorded.`);
    } finally {
      this.reload();
    }
  }

  async close() {
    const shift = this.shift();
    if (!shift) return;
    const body = await firstValueFrom(this.dialog.open(CashierCloseDialogComponent, { width: '480px', maxWidth: '94vw' }).afterClosed());
    if (!body) return;
    this.busy.set(true);
    try {
      this.justClosed.set(await firstValueFrom(this.api.close(this.storeId(), shift._id, body)));
    } catch (error) {
      this.fail(error, $localize`The shift could not be closed.`);
    } finally {
      this.busy.set(false);
      this.reload();
    }
  }
}
