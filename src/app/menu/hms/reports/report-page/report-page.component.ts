import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { NgTemplateOutlet, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HotelReportService, ReportColumn, ReportParams, ReportRow } from '../../../../shared/services/hotel-report.service';
import { ExportFormat, ReportExportService } from '../../../../shared/services/report-export.service';
import { RoomsService } from '../../../../shared/services/rooms.service';
import { RolesService } from '../../../../shared/services/roles.service';
import { StoreStore } from '../../../../shared/stores/store.store';
import { toDateOnly } from '../../../../shared/utils/date-only';
import { COLUMN_LABELS, DATE_PRESETS, DatePreset, KPI_LABELS, KPI_STYLE, REPORT_CATEGORIES, STATUS_TONES, TONE_CLASSES, reportById, statusLabel } from '../report-registry';

const PAGE_SIZE = 50;
const RECENT_KEY = 'shopbot.reports.recent';

type Preset = DatePreset;

const addDays = (day: string, n: number) => {
  const d = new Date(day + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return toDateOnly(d);
};

@Component({
  selector: 'app-report-page',
  imports: [NgTemplateOutlet, CurrencyPipe, DatePipe, DecimalPipe, ReactiveFormsModule, RouterLink, PageHeaderComponent, MatButtonModule, MatCardModule, MatChipsModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatPaginatorModule, MatProgressBarModule, MatSelectModule, MatSnackBarModule, MatSortModule, MatTableModule, MatTooltipModule],
  templateUrl: './report-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ReportPageComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(HotelReportService);
  private exporter = inject(ReportExportService);
  private storeStore = inject(StoreStore);
  private rooms = inject(RoomsService);
  private roles = inject(RolesService);
  private snack = inject(MatSnackBar);

  private params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private queryParams = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  readonly pageSize = PAGE_SIZE;
  readonly labels = COLUMN_LABELS;
  readonly kpiLabels = KPI_LABELS;
  readonly kpiStyle = KPI_STYLE;
  readonly toneClass = TONE_CLASSES;
  readonly presets = DATE_PRESETS;
  readonly today = toDateOnly(new Date());

  meta = computed(() => reportById(this.params().get('report')));
  category = computed(() => REPORT_CATEGORIES.find((c) => c.id === this.meta()?.category));
  storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  currency = computed(() => this.storeStore.selectedStore()?.currency ?? '');
  canExport = computed(() => this.roles.hasAny(['hotel.reports.export', 'finance.reports.export']));

  // Filters live in the URL, so a view can be bookmarked or shared.
  from = computed(() => this.queryParams().get('from') ?? (this.meta()?.filters.includes('dateRange') ? this.today : ''));
  to = computed(() => this.queryParams().get('to') ?? (this.meta()?.filters.includes('dateRange') ? this.from() : ''));
  status = computed(() => this.queryParams().get('status') ?? 'all');
  roomType = computed(() => this.queryParams().get('roomType') ?? 'all');
  q = computed(() => this.queryParams().get('q') ?? '');
  page = computed(() => Math.max(1, Number(this.queryParams().get('page')) || 1));

  /** The Material date range. The URL is the source of truth; this only mirrors it for the picker. */
  range = new FormGroup({ start: new FormControl<Date | null>(null), end: new FormControl<Date | null>(null) });
  searchText = new FormControl('', { nonNullable: true });

  busy = signal<ExportFormat | 'print' | null>(null);
  sortKey = signal<string | null>(null);
  sortDir = signal<'asc' | 'desc'>('asc');
  private searchTimer?: ReturnType<typeof setTimeout>;

  private result = rxResource({
    params: () => ({ id: this.storeId(), report: this.meta()?.id, from: this.from(), to: this.to(), status: this.status(), roomType: this.roomType(), q: this.q(), page: this.page(), n: this.refresh() }),
    stream: ({ params }) =>
      params.id && params.report
        ? this.api.run(params.id, params.report, { from: params.from, to: params.to, status: params.status, roomType: params.roomType, q: params.q, page: params.page, limit: PAGE_SIZE })
        : of(null),
  });
  private refresh = signal(0);

  roomTypes = rxResource({
    params: () => ({ id: this.storeId(), need: !!this.meta()?.filters.includes('roomType') }),
    stream: ({ params }) => (params.id && params.need ? this.rooms.getRoomTypes(params.id) : of([])),
  });

  data = computed(() => (this.result.hasValue() ? this.result.value() : null));
  loading = computed(() => this.result.isLoading());
  firstLoad = computed(() => this.result.isLoading() && !this.data());
  failed = computed(() => !!this.result.error() && !this.data());

  columns = computed<ReportColumn[]>(() => this.data()?.columns ?? []);
  /** Missing data still takes its place, so columns and card fields stay lined up. */
  isBlank(value: unknown): boolean {
    return value === null || value === undefined || value === '' || value === false;
  }

  /** A phone card shows the few fields that matter and tucks the rest behind "More details". */
  cardColumns = computed(() => {
    const rest = this.columns().filter((c) => c.key !== this.headlineKey() && c.type !== 'status');
    return { primary: rest.slice(0, 6), rest: rest.slice(6) };
  });
  displayedColumns = computed(() => this.columns().map((c) => c.key));
  /** The quick-date chip that matches the current range, if any. */
  activePreset = computed<Preset | null>(() => DATE_PRESETS.map((p) => p.id).find((id) => this.presetRange(id).join() === [this.from(), this.to()].join()) ?? null);
  /** The rows of this page, sorted by the clicked heading. */
  rows = computed<ReportRow[]>(() => {
    const rows = [...(this.data()?.rows ?? [])];
    const key = this.sortKey();
    if (!key) return rows;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return rows.sort((a, b) => {
      const x = a[key], y = b[key];
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
      return String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true }) * dir;
    });
  });
  /** On a phone each row becomes a card: its headline, and the remaining facts under it. */
  headlineKey = computed(() => ['guest', 'orderNumber', 'room'].find((k) => this.columns().some((c) => c.key === k)) ?? this.columns()[0]?.key);
  activeFilters = computed(() => [this.status() !== 'all', this.roomType() !== 'all', !!this.q()].filter(Boolean).length);

  constructor() {
    this.searchText.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.onSearchTyped(v));
    // Remember what was opened, for the "Recently opened" row on the hub.
    effect(() => {
      const id = this.meta()?.id;
      if (!id) return;
      untracked(() => {
        try {
          const recent: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
          localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...recent.filter((r) => r !== id)].slice(0, 6)));
        } catch { /* private mode: not worth failing for */ }
      });
    });
    // Keep the pickers and the search box in step with the URL (and with the browser's back button).
    effect(() => {
      const from = this.from(), to = this.to(), q = this.q();
      untracked(() => {
        const at = (d: string) => (d ? new Date(d + 'T12:00:00') : null);
        this.range.patchValue({ start: at(from), end: at(to) }, { emitEvent: false });
        if (this.searchText.value !== q) this.searchText.setValue(q, { emitEvent: false });
      });
    });
    // A new report starts unsorted.
    effect(() => { this.meta(); untracked(() => this.sortKey.set(null)); });
  }

  // ------------------------------------------------------------------ filters

  private go(patch: Record<string, string | number | null>) {
    this.router.navigate([], { relativeTo: this.route, queryParams: { page: null, ...patch }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  setDates(from: string, to: string) {
    if (!from) return;
    this.go({ from, to: to && to >= from ? to : from });
  }
  setStatus(value: string) { this.go({ status: value === 'all' ? null : value }); }
  setRoomType(value: string) { this.go({ roomType: value === 'all' ? null : value }); }
  onSearchTyped(value: string) {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.go({ q: value.trim() || null }), 350);
  }
  clearFilters() { this.go({ status: null, roomType: null, q: null }); }
  onPage(e: PageEvent) { this.router.navigate([], { relativeTo: this.route, queryParams: { page: e.pageIndex + 1 }, queryParamsHandling: 'merge', replaceUrl: true }); }
  reload() { this.refresh.update((n) => n + 1); }

  private presetRange(name: Preset): [string, string] {
    const t = this.today;
    const d = new Date(t + 'T12:00:00');
    const monday = addDays(t, -((d.getDay() + 6) % 7));
    const first = (y: number, m: number) => toDateOnly(new Date(y, m, 1, 12));
    const last = (y: number, m: number) => toDateOnly(new Date(y, m + 1, 0, 12));
    const ranges: Record<Preset, [string, string]> = {
      today: [t, t], yesterday: [addDays(t, -1), addDays(t, -1)], tomorrow: [addDays(t, 1), addDays(t, 1)], week: [monday, addDays(monday, 6)], next7: [t, addDays(t, 6)],
      month: [first(d.getFullYear(), d.getMonth()), last(d.getFullYear(), d.getMonth())], lastMonth: [first(d.getFullYear(), d.getMonth() - 1), last(d.getFullYear(), d.getMonth() - 1)],
    };
    return ranges[name];
  }
  preset(name: Preset | null) {
    if (name) this.setDates(...this.presetRange(name));
  }
  /** The picker reports a range only once both ends are chosen. */
  onRangePicked() {
    const { start, end } = this.range.value;
    if (start && end) this.setDates(toDateOnly(start), toDateOnly(end));
  }

  onSort(sort: Sort) {
    this.sortKey.set(sort.direction ? sort.active : null);
    this.sortDir.set(sort.direction === 'desc' ? 'desc' : 'asc');
  }


  // ------------------------------------------------------------------ cells

  asDate(v: unknown) { return v ? new Date(String(v).length === 10 ? v + 'T12:00:00' : String(v)) : null; }
  tone(v: unknown) { const t = STATUS_TONES[String(v)]; return t ? { background: t[0], color: t[1] } : { background: '#e2e8f0', color: '#334155' }; }
  statusText = statusLabel;
  title(key: string) { return this.labels[key] ?? key; }

  drillLink(row: ReportRow): string[] | null {
    const kind = this.data()?.drill;
    if (!row.id) return null;
    if (kind === 'reservation') return ['/menu/hms/front-desk/reservations/edit', String(row.id)];
    if (kind === 'order') return ['/menu/dashboard/reports/receipts', String(row.id)];
    return null;
  }
  open(row: ReportRow) {
    const link = this.drillLink(row);
    if (link) this.router.navigate(link);
  }

  // ------------------------------------------------------------------ export

  async export(format: ExportFormat | 'print') {
    const meta = this.meta();
    if (!meta || !this.storeId()) return;
    this.busy.set(format);
    try {
      const all = await firstValueFrom(this.api.run(this.storeId(), meta.id, { from: this.from(), to: this.to(), status: this.status(), roomType: this.roomType(), q: this.q(), all: true } as ReportParams));
      if (!all.rows.length) {
        this.snack.open($localize`There is nothing to export for these filters.`, $localize`Close`, { duration: 4000 });
        return;
      }
      const store = this.storeStore.selectedStore();
      const request = {
        title: meta.title,
        storeName: store?.name ?? '',
        currency: store?.currencyCode ?? store?.currency,
        subtitle: [all.from ? (all.from === all.to ? all.from : `${all.from} → ${all.to}`) : '', this.status() !== 'all' ? this.statusText(this.status()) : '', this.q() ? `"${this.q()}"` : ''].filter(Boolean).join('  ·  '),
        info: [[$localize`Report`, meta.title], [$localize`Rows`, String(all.rows.length)], ...(this.q() ? [[$localize`Search`, this.q()] as [string, string]] : [])] as Array<[string, string]>,
        columns: all.columns.map((c) => ({ key: c.key, type: c.type, label: this.title(c.key) })),
        rows: all.rows,
        filename: `${store?.name ?? 'hotel'}-${meta.id}-${all.from ?? this.today}${all.to && all.to !== all.from ? '_' + all.to : ''}`,
        landscape: meta.wide !== false,
        statusLabel: this.statusText,
        yes: $localize`Yes`,
        no: $localize`No`,
      };
      if (format === 'print') this.exporter.print(request);
      else this.exporter.export(format, request);
    } catch {
      this.snack.open($localize`The export could not be prepared. Try again.`, $localize`Close`, { duration: 5000, panelClass: ['error-snackbar'] });
    } finally {
      this.busy.set(null);
    }
  }
}
