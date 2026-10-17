import { ChangeDetectionStrategy, Component, DestroyRef, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, formatCurrency } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { TrPipe } from '../../../shared/i18n/tr.pipe';
import { AttentionItem, DashboardStay, HotelDashboard, HotelDashboardService } from '../../../shared/services/hotel-dashboard.service';
import { ChartThemeService } from '../../../shared/services/chart-theme.service';
import { StoreStore } from '../../../shared/stores/store.store';
import { STATUS_TONES, statusLabel } from '../reports/report-registry';

const BASE = '/menu/hms/reports';
const RESERVATION = ['/menu/hms/front-desk/reservations/edit'];

/** What each "needs attention" code says, where it goes, and how it looks. */
const ATTENTION: Record<string, { icon: string; text: (n: number) => string; link: (today: string) => { path: string[]; query?: Record<string, string> } }> = {
  NIGHT_AUDIT_BEHIND: { icon: 'nights_stay', text: (n) => $localize`${n} business day(s) are waiting to be closed`, link: () => ({ path: ['/menu/hms/night-audit'] }) },
  OVERDUE_DEPARTURES: { icon: 'schedule', text: (n) => $localize`${n} guest(s) are still in their room past their check-out day`, link: () => ({ path: [BASE, 'guests', 'in-house'], query: { status: 'overdue' } }) },
  STALE_ARRIVALS: { icon: 'event_busy', text: (n) => $localize`${n} booking(s) never arrived and are still waiting`, link: (t) => ({ path: [BASE, 'guests', 'arrivals'], query: { from: shift(t, -30), to: shift(t, -1), status: 'waiting' } }) },
  DEPARTING_WITH_BALANCE: { icon: 'account_balance_wallet', text: (n) => $localize`${n} guest(s) leaving today still owe money`, link: () => ({ path: [BASE, 'guests', 'departures'], query: { status: 'checked_in' } }) },
  DIRTY_ROOMS_FOR_ARRIVALS: { icon: 'cleaning_services', text: (n) => $localize`${n} room(s) are dirty but a guest arrives today`, link: () => ({ path: [BASE, 'housekeeping', 'room-status'], query: { status: 'dirty' } }) },
  MISSING_GUEST_ID: { icon: 'badge', text: (n) => $localize`${n} guest(s) in the house have no ID on file`, link: (t) => ({ path: [BASE, 'guests', 'guest-register'], query: { from: t, to: t } }) },
  ARRIVALS_WAITING: { icon: 'login', text: (n) => $localize`${n} arrival(s) today have not checked in yet`, link: (t) => ({ path: [BASE, 'guests', 'arrivals'], query: { from: t, to: t, status: 'waiting' } }) },
  ROOMS_OUT_OF_ORDER: { icon: 'build', text: (n) => $localize`${n} room(s) are out of order`, link: () => ({ path: [BASE, 'housekeeping', 'room-status'], query: { status: 'out_of_order' } }) },
  OPEN_SHIFTS: { icon: 'point_of_sale', text: (n) => $localize`${n} cashier shift(s) are open`, link: () => ({ path: ['/menu/hms/cashier'] }) },
};

function shift(day: string, days: number): string {
  const d = new Date(day + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const ACTIVITY: Record<string, { icon: string; text: string }> = {
  checked_in: { icon: 'login', text: $localize`checked in` },
  checked_out: { icon: 'logout', text: $localize`checked out` },
  confirmed: { icon: 'event_available', text: $localize`booked` },
  pending: { icon: 'hourglass_top', text: $localize`pending booking` },
  reserved: { icon: 'bookmark', text: $localize`reserved` },
  cancelled: { icon: 'event_busy', text: $localize`cancelled` },
  no_show: { icon: 'person_off', text: $localize`did not arrive` },
};

const compact = (n: number) => new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n);

/** The PMS front page: how the day is going, what needs a person, who is coming and going, and how the hotel is doing. */
@Component({
  selector: 'app-overview',
  imports: [TrPipe, CurrencyPipe, DatePipe, DecimalPipe, RouterLink, MatButtonModule, MatIconModule, MatTooltipModule, BaseChartDirective],
  templateUrl: './overview.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class OverviewComponent {
  private readonly api = inject(HotelDashboardService);
  private readonly storeStore = inject(StoreStore);
  private readonly router = inject(Router);
  private readonly locale = inject(LOCALE_ID);
  // Keeps Chart.js text and grid colours in step with the light/dark theme.
  private readonly chartTheme = inject(ChartThemeService);

  private readonly refresh = signal(0);
  readonly storeId = computed(() => this.storeStore.selectedStore()?._id ?? '');
  readonly storeName = computed(() => this.storeStore.selectedStore()?.name ?? '');

  private readonly res = rxResource({
    params: () => ({ id: this.storeId(), n: this.refresh() }),
    stream: ({ params }) => (params.id ? this.api.get(params.id) : of(null)),
  });
  readonly data = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly loading = computed(() => this.res.isLoading());
  readonly failed = computed(() => !!this.res.error() && !this.data());
  readonly currency = computed(() => this.data()?.currency || this.storeStore.selectedStore()?.currency || '');

  readonly d = this.data; // the movements template reads the same snapshot
  readonly subtitle = computed(() => {
    const d = this.data();
    const day = d ? new Intl.DateTimeFormat(this.locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(this.asDay(d.today)!) : '';
    return [this.storeName(), day].filter(Boolean).join(' · ');
  });
  readonly movementColumns = computed(() => (this.data()?.canSeeMoney ? ['guest', 'rooms', 'party', 'balance', 'status', 'go'] : ['guest', 'rooms', 'party', 'status', 'go']));

  constructor() {
    // Keep the screen fresh without a click: the front desk leaves it open all day.
    const timer = setInterval(() => { if (!document.hidden) this.reload(); }, 120_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  reload() { this.refresh.update((n) => n + 1); }

  asDay(day: string | null | undefined) { return day ? new Date(day + 'T12:00:00') : null; }

  // ---------------------------------------------------------------- headline tiles

  /** Percent-point change against a reference day, as a small signed number. */
  delta(now: number | null | undefined, before: number | null | undefined): number | null {
    return now === null || now === undefined || before === null || before === undefined ? null : Math.round((now - before) * 10) / 10;
  }
  /** Relative change of a money figure (a day against the day before). */
  change(now: number | undefined, before: number | undefined): number | null {
    if (now === undefined || before === undefined) return null;
    if (before === 0) return now === 0 ? 0 : null;
    return Math.round(((now - before) / before) * 100);
  }
  progress(done: number, total: number) { return total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0; }

  // ---------------------------------------------------------------- attention

  attentionText(item: AttentionItem) { return (ATTENTION[item.code]?.text(item.count)) ?? item.code; }
  attentionIcon(item: AttentionItem) { return ATTENTION[item.code]?.icon ?? 'info'; }
  attentionCard(item: AttentionItem) {
    return item.severity === 'critical' ? 'border-red-200 bg-red-50 text-red-900' : item.severity === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-sky-200 bg-sky-50 text-sky-900';
  }
  attentionIconTone(item: AttentionItem) {
    return item.severity === 'critical' ? 'bg-red-100 text-red-700' : item.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700';
  }
  go(item: AttentionItem) {
    const target = ATTENTION[item.code]?.link(this.data()?.today ?? '');
    if (target) this.router.navigate(target.path, { queryParams: target.query });
  }
  openSample(kind: 'reservation' | 'room', id: string) {
    if (kind === 'reservation') this.router.navigate([...RESERVATION, id]);
    else this.router.navigate([BASE, 'housekeeping', 'room-status']);
  }

  // ---------------------------------------------------------------- lists

  openStay(stay: DashboardStay) { this.router.navigate([...RESERVATION, stay.id]); }
  tone(v: string) { const t = STATUS_TONES[v]; return t ? { background: t[0], color: t[1] } : { background: '#e2e8f0', color: '#334155' }; }
  statusText = statusLabel;
  activityIcon(type: string) { return ACTIVITY[type]?.icon ?? 'info'; }
  activityText(type: string) { return ACTIVITY[type]?.text ?? type; }
  timeAgo(iso: string): string {
    const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: 'auto' });
    if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
    if (Math.abs(minutes) < 60 * 24) return rtf.format(Math.round(minutes / 60), 'hour');
    return rtf.format(Math.round(minutes / 1440), 'day');
  }
  methodLabel(method: string) { return method.replace(/_/g, ' '); }

  // ---------------------------------------------------------------- room board

  readonly board = computed(() => {
    const r = this.data()?.rooms;
    if (!r || !r.total) return [];
    const vacant = Math.max(0, r.vacantClean);
    return [
      { key: 'occupied', label: $localize`Occupied`, value: r.occupied, bar: 'bg-primary' },
      { key: 'clean', label: $localize`Ready to sell`, value: vacant, bar: 'bg-green-500' },
      { key: 'dirty', label: $localize`Needs cleaning`, value: r.dirty, bar: 'bg-amber-500' },
      { key: 'ooo', label: $localize`Out of order`, value: r.outOfOrder, bar: 'bg-outline' },
    ].map((s) => ({ ...s, percent: (s.value / r.total) * 100 }));
  });

  readonly sourceRows = computed(() => {
    const rows = this.data()?.sources ?? [];
    const max = Math.max(1, ...rows.map((s) => s.revenue));
    return rows.map((s) => ({ ...s, percent: Math.round((s.revenue / max) * 100) }));
  });

  // ---------------------------------------------------------------- charts

  private weekday(day: string) { return new Intl.DateTimeFormat(this.locale, { weekday: 'short', day: 'numeric' }).format(this.asDay(day)!); }

  readonly occupancyData = computed<ChartData<'bar'>>(() => {
    const t = this.data()?.trend ?? [];
    const today = this.data()?.today;
    return {
      labels: t.map((d) => this.weekday(d.date)),
      datasets: [{
        label: $localize`Occupancy`,
        data: t.map((d) => d.occupancy ?? 0),
        backgroundColor: t.map((d) => (d.date === today ? 'rgba(79, 70, 229, 1)' : d.future ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.8)')),
        borderRadius: 4,
        maxBarThickness: 28,
      }],
    };
  });
  readonly occupancyOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.parsed.y}%` } } },
    scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + '%', maxTicksLimit: 5 } }, x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } } },
  };

  readonly revenueData = computed<ChartData<'bar'>>(() => {
    const t = (this.data()?.trend ?? []).filter((d) => !d.future);
    const today = this.data()?.today;
    return {
      labels: t.map((d) => this.weekday(d.date)),
      datasets: [{
        label: $localize`Room revenue`,
        data: t.map((d) => d.roomRevenue ?? 0),
        backgroundColor: t.map((d) => (d.date === today ? 'rgba(22, 163, 74, 1)' : 'rgba(34, 197, 94, 0.75)')),
        borderRadius: 4,
        maxBarThickness: 28,
      }],
    };
  });
  readonly revenueOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${this.currency()} ${new Intl.NumberFormat(this.locale).format(c.parsed.y ?? 0)}` } } },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => compact(Number(v)), maxTicksLimit: 5 } }, x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7 } } },
  };

  // ---------------------------------------------------------------- hero

  /** First-run checklist: a real sequence, because rooms need types and a booking needs rooms. */
  readonly setupSteps = [
    { title: $localize`Add your room types`, text: $localize`Deluxe, Suite, Standard: group rooms that sell at the same price.`, action: $localize`Add room types`, icon: 'category', tone: 'bg-indigo-100 text-indigo-700', link: '/menu/hms/rooms-management/room-types' },
    { title: $localize`Add your rooms`, text: $localize`Every door a guest can sleep behind, with its number and floor.`, action: $localize`Add rooms`, icon: 'meeting_room', tone: 'bg-sky-100 text-sky-700', link: '/menu/hms/rooms-management/rooms' },
    { title: $localize`Set your rates`, text: $localize`Say what each room type costs per night.`, action: $localize`Set rates`, icon: 'sell', tone: 'bg-emerald-100 text-emerald-700', link: '/menu/hms/rooms-management/rate-plans' },
    { title: $localize`Take a booking`, text: $localize`Create the first reservation and watch this page come alive.`, action: $localize`New reservation`, icon: 'event_available', tone: 'bg-amber-100 text-amber-700', link: '/menu/hms/front-desk/reservations/create' },
  ];

  /** The one sentence a manager wants first. */
  readonly heroLine = computed(() => {
    const k = this.data()?.kpis.occupancy;
    if (!k || k.percent === null) return $localize`Welcome back`;
    const sold = k.roomsSold, total = k.sellableRooms;
    return $localize`${sold} of ${total} rooms are sold tonight`;
  });
  readonly heroSub = computed(() => {
    const k = this.data()?.kpis;
    if (!k) return '';
    const arrived = k.arrivals.arrived, expected = k.arrivals.expected, left = k.departures.left, due = k.departures.due;
    if (!expected && !due) return $localize`No arrivals or departures today.`;
    return $localize`${arrived} of ${expected} arrivals are in, ${left} of ${due} departures have left.`;
  });
  readonly dateLabel = computed(() => {
    const d = this.data();
    return d ? new Intl.DateTimeFormat(this.locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(this.asDay(d.today)!) : '';
  });

  /** The occupancy ring: a circle of radius 52 filled to the percentage. */
  readonly ringLength = 2 * Math.PI * 52;
  readonly ringOffset = computed(() => this.ringLength * (1 - Math.min(100, Math.max(0, this.data()?.kpis.occupancy.percent ?? 0)) / 100));

  // ---------------------------------------------------------------- tiles with sparklines

  /** A tiny line and soft area for the last values, drawn in a 120 x 36 box. */
  spark(values: number[]): { line: string; area: string } | null {
    if (values.length < 2 || Math.max(...values) === 0) return null; // nothing happened yet: no flat line
    const max = Math.max(...values), min = Math.min(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => [(i / (values.length - 1)) * 120, 32 - ((v - min) / span) * 28] as const);
    const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    return { line, area: `${line} L120,36 L0,36 Z` };
  }

  readonly tiles = computed(() => {
    const d = this.data();
    if (!d) return [];
    const past = d.trend.filter((t) => !t.future);
    const k = d.kpis;
    const tiles: Array<{ key: string; label: string; kind: 'percent' | 'money' | 'int'; value: number | null; sub: string; icon: string; tone: string; link: string; spark: { line: string; area: string } | null; sparkTone: string; delta: number | null; deltaUnit: string }> = [
      { key: 'occ', label: $localize`Occupancy`, kind: 'percent', value: k.occupancy.percent, sub: $localize`${k.occupancy.roomsSold} of ${k.occupancy.sellableRooms} rooms`, icon: 'hotel', tone: 'bg-indigo-100 text-indigo-700', link: '/menu/hms/reports/occupancy', spark: this.spark(past.map((t) => t.occupancy ?? 0)), sparkTone: 'stroke-indigo-500 fill-indigo-500/15', delta: this.delta(k.occupancy.percent, k.occupancy.yesterdayPercent), deltaUnit: $localize`pts vs yesterday` },
      { key: 'house', label: $localize`In the house`, kind: 'int', value: k.inHouse.guests, sub: $localize`guests in ${k.inHouse.stays} stay(s)`, icon: 'groups', tone: 'bg-sky-100 text-sky-700', link: '/menu/hms/reports/guests/in-house', spark: this.spark(past.map((t) => t.roomsSold)), sparkTone: 'stroke-sky-500 fill-sky-500/15', delta: null, deltaUnit: '' },
    ];
    if (k.revenue) {
      tiles.push(
        { key: 'rev', label: $localize`Room revenue`, kind: 'money', value: k.revenue.today, sub: $localize`ADR ${this.money(k.revenue.adr)} · RevPAR ${this.money(k.revenue.revpar)}`, icon: 'payments', tone: 'bg-emerald-100 text-emerald-700', link: '/menu/hms/reports/revenue', spark: this.spark(past.map((t) => t.roomRevenue ?? 0)), sparkTone: 'stroke-emerald-500 fill-emerald-500/15', delta: this.change(k.revenue.today, k.revenue.yesterday), deltaUnit: $localize`% vs yesterday` },
        { key: 'owed', label: $localize`Owed by guests`, kind: 'money', value: k.balanceDue ?? 0, sub: $localize`open balance in the house`, icon: 'account_balance_wallet', tone: 'bg-rose-100 text-rose-700', link: '/menu/hms/reports/guests/in-house', spark: null, sparkTone: '', delta: null, deltaUnit: '' },
      );
    }
    return tiles;
  });
  /** Store currencies are free text ("RS", "FRW"), not always ISO codes, so use Angular's formatter, which takes any symbol, rather than Intl. */
  private money(v: number | null | undefined) { return formatCurrency(v ?? 0, this.locale, this.currency() || '', undefined, '1.0-0'); }

  // ---------------------------------------------------------------- people

  private readonly avatarTones = ['bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-800', 'bg-rose-100 text-rose-700', 'bg-violet-100 text-violet-700', 'bg-teal-100 text-teal-700'];
  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }
  avatarTone(name: string): string {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return this.avatarTones[h % this.avatarTones.length];
  }
  statusDot(status: string): string {
    return status === 'checked_in' ? 'bg-emerald-500' : status === 'checked_out' ? 'bg-slate-400' : status === 'confirmed' ? 'bg-blue-500' : 'bg-amber-500';
  }

  // ---------------------------------------------------------------- room map

  readonly roomTones: Record<string, string> = {
    occupied: 'bg-primary text-on-primary',
    ready: 'bg-emerald-100 text-emerald-800',
    dirty: 'bg-amber-100 text-amber-800',
    out_of_order: 'bg-surface-container-high text-on-surface-variant line-through',
  };
  roomTip(r: HotelDashboard['roomMap'][number]): string {
    const state = r.state === 'occupied' ? (r.guest ? `${r.guest}${r.checkOut ? ' · ' + $localize`leaves` + ' ' + new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'short' }).format(this.asDay(r.checkOut)!) : ''}` : $localize`Occupied`) : r.state === 'ready' ? $localize`Ready to sell` : r.state === 'dirty' ? $localize`Needs cleaning` : $localize`Out of order`;
    return `${r.number}${r.type ? ' · ' + r.type : ''} — ${state}`;
  }

  // ---------------------------------------------------------------- money split bars

  private readonly segTones = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-violet-500'];
  readonly sourceSegs = computed(() => {
    const rows = this.data()?.sources ?? [];
    const total = rows.reduce((s, r) => s + r.revenue, 0) || 1;
    return rows.map((r, i) => ({ label: r.source, amount: r.revenue, percent: (r.revenue / total) * 100, tone: this.segTones[i % this.segTones.length] }));
  });
  readonly paymentSegs = computed(() => {
    const rows = (this.data()?.payments?.byMethod ?? []).filter((m) => m.amount > 0);
    const total = rows.reduce((s, r) => s + r.amount, 0) || 1;
    return rows.map((r, i) => ({ label: r.method, amount: r.amount, percent: (r.amount / total) * 100, tone: this.segTones[i % this.segTones.length] }));
  });

  /** Rooms on the books for the next two weeks, as one number a revenue manager can quote. */
  readonly forecast = computed(() => {
    const future = (this.data()?.trend ?? []).filter((d) => d.future && d.occupancy !== null);
    if (!future.length) return null;
    const avg = Math.round(future.reduce((s, d) => s + (d.occupancy ?? 0), 0) / future.length);
    const peak = future.reduce((a, b) => ((b.occupancy ?? 0) > (a.occupancy ?? 0) ? b : a));
    return { avg, peak: peak.date, peakPercent: Math.round(peak.occupancy ?? 0) };
  });
}
