import {
  Component,
  signal,
  output,
  inject,
  computed,
  effect,
  untracked,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { OrderService } from '../../services/orders.service';
import { FormGroup, FormControl } from '@angular/forms';
import { StoreStore } from '../../stores/store.store';
import { QueryParamService } from '../../services/query-param.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-employee-selector',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label><ng-container i18n>All employees</ng-container></mat-label>
      <mat-select
        [value]="selectedEmployee()"
        (selectionChange)="onSelectionChange($event.value)"
        >
        <mat-option value="all"><ng-container i18n>All employees</ng-container></mat-option>
        @for (employee of employees(); track employee._id) {
          <mat-option [value]="employee._id" data-testid="employee-option">
            {{ employee.name }}@if (employee.deactivated) { <ng-container i18n>(deactivated)</ng-container>}@if (employee.noSales) { <span class="ml-1 text-xs opacity-60"><ng-container i18n>(no sales in this period)</ng-container></span>}
          </mat-option>
        } @empty {
          @if (!loadingSellers()) {
            <mat-option disabled data-testid="employee-none"><ng-container i18n>Nobody made a sale in this period</ng-container></mat-option>
          }
        }
      </mat-select>
    </mat-form-field>
    `,
})
export class EmployeeSelectorComponent implements OnInit {
  public queryParamsService = inject(QueryParamService);
  public storeStore = inject(StoreStore);
  private userService = inject(UserService);

  public selectedEmployee = signal<string>(this.queryParamsService.getAllParamsSnapshot['employee'] || 'all');
  public selectionChange = output<string>();
  public employeeForm = new FormGroup({
    employee: new FormControl<string | null>(this.selectedEmployee()),
  });

  private orderService = inject(OrderService);
  private query = toSignal(this.queryParamsService.getAllParams$, { initialValue: this.queryParamsService.getAllParamsSnapshot as Record<string, any> });

  // Store.staffs[] is the pre-membership list and now only holds bare ids,
  // so the team comes from memberships — the same source as Team settings.
  private team = rxResource({
    params: () => this.storeStore.selectedStore()?._id,
    stream: ({ params: storeId }) => this.userService.getTeamForStore(storeId),
  });

  /** The box follows the address bar: a link, the back button or another control that sets `employee` is reflected here too. */
  private followUrl = effect(() => {
    const fromUrl = String(this.query()?.['employee'] || 'all');
    untracked(() => {
      if (fromUrl !== this.selectedEmployee()) {
        this.selectedEmployee.set(fromUrl);
        this.employeeForm.patchValue({ employee: fromUrl }, { emitEvent: false });
      }
    });
  });

  /** The chosen dates, as the report pages ask for them (the whole of the last day included). */
  private period = computed(() => {
    const q = this.query() ?? {};
    return q['start'] && q['end'] ? { start: `${q['start']}T00:00:00`, end: `${q['end']}T23:59:59.999` } : null;
  }, { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) });

  /** Who sold in that period, from the same figures as the Sales by employee report. */
  private sellers = rxResource({
    params: () => {
      const storeId = this.storeStore.selectedStore()?._id;
      const period = this.period();
      return storeId && period ? { storeId, ...period } : undefined;
    },
    stream: ({ params }) =>
      this.orderService.getSalesByEmployees(params.storeId, { start: params.start, end: params.end }).pipe(catchError(() => of(null))),
  });

  /** The last answer stays on screen while the next period loads, so the list does not blink empty. */
  private lastSellers = signal<any[] | null>(null);
  /** Names seen in any period so far, so someone chosen earlier keeps their name when the dates move on. */
  private seenNames = signal<ReadonlyMap<string, string>>(new Map());
  private keepLast = effect(() => {
    const v = this.sellers.hasValue() ? this.sellers.value() : undefined;
    if (v === undefined) return;
    this.lastSellers.set(v);
    untracked(() => {
      const next = new Map(this.seenNames());
      for (const r of v ?? []) if (r._id && r.name) next.set(String(r._id), r.name);
      this.seenNames.set(next);
    });
  });
  protected readonly loadingSellers = computed(() => this.sellers.isLoading() && this.lastSellers() === null);

  // Only people who made a sale in the period are offered. The one already chosen always stays in the list (marked when
  // they sold nothing this time), so the filter never silently changes under the user. Invited people haven't joined, and
  // deactivated staff stay listed when they sold: their past sales still need to be filterable.
  protected readonly employees = computed(() => {
    const team = new Map((this.team.hasValue() ? this.team.value() : []).filter((m) => !!m.merchant?._id).map((m) => [String(m.merchant._id), m]));
    const seen = this.seenNames();
    const nameOf = (id: string, fallback?: string) => fallback || team.get(id)?.merchant?.name || team.get(id)?.merchant?.email || seen.get(id) || '';
    const sold = this.lastSellers();
    let list: Array<{ _id: string; name: string; deactivated: boolean; noSales: boolean }>;
    if (sold === null) {
      // The sales could not be read (or the period is not known yet): fall back to the whole team rather than an empty filter.
      list = [...team.values()]
        .filter((m) => m.status !== 'INVITED')
        .map((m) => ({ _id: m.merchant._id, name: m.merchant.name || m.merchant.email, deactivated: m.status === 'SUSPENDED', noSales: false }));
    } else {
      list = sold
        .filter((r) => !!r._id && (r.receipts ?? 0) > 0)
        .map((r) => ({ _id: String(r._id), name: nameOf(String(r._id), r.name) || $localize`Employee`, deactivated: team.get(String(r._id))?.status === 'SUSPENDED', noSales: false }));
    }
    const chosen = this.selectedEmployee();
    if (chosen !== 'all' && !list.some((e) => e._id === chosen)) {
      list.push({ _id: chosen, name: nameOf(chosen) || $localize`Selected employee`, deactivated: team.get(chosen)?.status === 'SUSPENDED', noSales: sold !== null });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  });

  public onSelectionChange(value: string): void {
    this.selectedEmployee.set(value);
    this.selectionChange.emit(value);
    this.employeeForm.patchValue({ employee: value });
  }

  ngOnInit() {
    this.employeeForm.valueChanges.subscribe((value) => {
      this.queryParamsService.add({ employee: value.employee });
    });

    setTimeout(() => {
      this.employeeForm.patchValue(
        {
          employee: this.selectedEmployee(),
        },
        { emitEvent: true }
      );
    }, 100);
  }
}
