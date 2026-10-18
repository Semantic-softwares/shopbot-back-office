import {
  Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { QuickReservationModalComponent, QuickReservationData, QuickReservationDialogData } from '../../quick-reservation-modal/quick-reservation-modal.component';
import { ReservationPreviewDialogComponent } from '../reservation-preview-dialog/reservation-preview-dialog.component';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { ReservationService } from '../../../../../../shared/services/reservation.service';
import { RoomsService } from '../../../../../../shared/services/rooms.service';
import { RateInventoryService } from '../../../../../../shared/services/rate-inventory.service';
import type { AvailabilityCell } from '../../../../../../shared/services/rate-inventory.service';
import { PageHeaderComponent } from '../../../../../../shared/components/page-header/page-header.component';
import { TrPipe } from '../../../../../../shared/i18n/tr.pipe';
import {
  STAY_COLORS, STAY_ICONS, StayStatus, Urgency, addDays, dayKey, layoutBar, occupancyPerNight, overlapsAny, parseDay, urgencyOf,
} from './tape-chart.util';

type Density = 'comfortable' | 'compact';
type Focus = 'arrivals' | 'departures' | 'inhouse' | null;
type RangeDays = 7 | 14 | 30;

interface DayColumn {
  index: number;
  key: string;
  date: Date;
  day: number;
  weekday: string;
  isToday: boolean;
  isWeekend: boolean;
}

/** One stay of one room, ready to draw. */
interface Bar {
  key: string;
  reservation: any;
  roomId: string | null;
  left: number;
  width: number;
  startsBefore: boolean;
  endsAfter: boolean;
  nights: number;
  status: StayStatus;
  statusLabel: string;
  icon: string;
  color: string;
  guest: string;
  isGroup: boolean;
  modified: boolean;
  balance: number;
  urgency: Urgency;
  source: string;
  sourceLogo: string | null;
  checkInKey: string;
  checkOutKey: string;
  haystack: string;
  tooltip: string;
}

interface GroupCell {
  availability: number | null;
  badge: 'SS' | 'CTA' | 'CTD' | null;
  closed: boolean;
  tip: string;
}

interface GroupRow {
  kind: 'group';
  id: string;
  name: string;
  roomCount: number;
  collapsed: boolean;
  cells: GroupCell[];
}

interface RoomRow {
  kind: 'room';
  id: string;
  roomId: string;
  name: string;
  capacity: number;
  typeId: string | null;
  typeName: string;
  hk: string;
  outOfOrder: boolean;
  bars: Bar[];
}

interface OtaRow {
  kind: 'ota';
  id: string;
  typeId: string | null;
  typeName: string;
  bars: Bar[];
}

type Row = GroupRow | RoomRow | OtaRow;

interface Selection {
  rowId: string;
  roomId: string;
  roomName: string;
  typeId: string | null;
  typeName: string;
  from: number;
  to: number;
  ok: boolean;
  reason: string;
}

const STATUS_LABELS: Record<StayStatus, () => string> = {
  pending: () => $localize`Pending`,
  confirmed: () => $localize`Confirmed`,
  reserved: () => $localize`Reserved`,
  checked_in: () => $localize`Checked in`,
  checked_out: () => $localize`Checked out`,
  cancelled: () => $localize`Cancelled`,
  no_show: () => $localize`No-show`,
};

const SOURCE_COLORS: Record<string, string> = {
  'booking.com': '#003580', expedia: '#002F6C', airbnb: '#FF5A5F', agoda: '#5C2D91', walk_in: '#16A34A', direct: '#4B5563',
  phone: '#0EA5E9', online: '#6366F1', travel_agent: '#7C3AED', corporate: '#334155',
};
const SOURCE_NAMES: Record<string, () => string> = {
  'booking.com': () => 'Booking.com', expedia: () => 'Expedia', agoda: () => 'Agoda', airbnb: () => 'Airbnb', direct: () => $localize`Direct`,
  phone: () => $localize`Phone`, online: () => $localize`Online`, walk_in: () => $localize`Walk-in`, travel_agent: () => $localize`Agent`, corporate: () => $localize`Corporate`,
};
const SOURCE_LOGOS: Record<string, string> = {
  airbnb: 'https://cdn.brandfetch.io/idkuvXnjOH/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1717146459610',
  agoda: 'https://cdn.brandfetch.io/idrJbkwvG0/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1724730098837',
  expedia: 'https://cdn.brandfetch.io/idAGaivHFH/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1740983477322',
  'booking.com': 'https://cdn.brandfetch.io/id9mEmLNcV/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1725855381233',
};

const PREFS_KEY = 'shopbot.tapechart';
const MIN_DAY_WIDTH: Record<RangeDays, number> = { 7: 96, 14: 64, 30: 46 };

@Component({
  selector: 'app-reservations-calendar',
  standalone: true,
  imports: [
    TrPipe, CommonModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, MatProgressBarModule,
    MatDialogModule, PageHeaderComponent,
  ],
  templateUrl: './reservations-calendar.html',
  styleUrl: './reservations-calendar.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ReservationsCalendar {
  public storeStore = inject(StoreStore);
  private reservationService = inject(ReservationService);
  private roomService = inject(RoomsService);
  private rateInventoryService = inject(RateInventoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);

  private scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  public isMobile = toSignal(this.breakpointObserver.observe([Breakpoints.XSmall]).pipe(map((r) => r.matches)), { initialValue: false });

  // ---- view state (remembered between visits) -----------------------------------------------------------
  private prefs = this.readPrefs();
  readonly rangeOptions: RangeDays[] = [7, 14, 30];
  readonly rangeDays = signal<RangeDays>(this.prefs.days);
  readonly density = signal<Density>(this.prefs.density);
  readonly hidden = signal<Set<StayStatus>>(new Set(this.prefs.hidden));
  readonly typeFilter = signal<Set<string>>(new Set());
  readonly collapsed = signal<Set<string>>(new Set());
  readonly search = signal('');
  readonly focus = signal<Focus>(null);
  readonly hoverCol = signal<number | null>(null);
  readonly selection = signal<Selection | null>(null);
  readonly viewportWidth = signal(1200);

  /** "Today" is fixed for the life of the page; the chart does not need to tick over at midnight. */
  readonly today = parseDay(new Date());
  readonly todayKey = dayKey(this.today);
  readonly start = signal<Date>(addDays(this.today, -1));

  private savePrefs = effect(() => {
    const payload = { days: this.rangeDays(), density: this.density(), hidden: [...this.hidden()] };
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(payload)); } catch { /* private mode: nothing to remember */ }
  });

  private resizeObserver?: ResizeObserver;

  /**
   * Measure the scroll area whenever it exists. It is only rendered once the data is ready, so a one-off
   * measurement at first render would miss it and the days would stay at the 1200px default width.
   */
  private watchViewport = effect(() => {
    const el = this.scroller()?.nativeElement;
    this.resizeObserver?.disconnect();
    if (!el || typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(([entry]) => this.viewportWidth.set(entry.contentRect.width));
    this.resizeObserver.observe(el);
    this.viewportWidth.set(el.clientWidth);
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.resizeObserver?.disconnect());
  }

  // ---- geometry -------------------------------------------------------------------------------------
  readonly leftWidth = computed(() => (this.isMobile() ? 112 : 188));
  readonly dayWidth = computed(() => {
    const days = this.rangeDays();
    // Stretch the days to fill the card; never narrower than the readable minimum (then it scrolls sideways).
    const fit = (this.viewportWidth() - this.leftWidth()) / days;
    return Math.max(MIN_DAY_WIDTH[days], fit);
  });
  readonly rowHeight = computed(() => (this.density() === 'compact' ? 32 : 46));
  readonly trackWidth = computed(() => this.rangeDays() * this.dayWidth());

  readonly columns = computed<DayColumn[]>(() => {
    const out: DayColumn[] = [];
    const names = [$localize`Sun`, $localize`Mon`, $localize`Tue`, $localize`Wed`, $localize`Thu`, $localize`Fri`, $localize`Sat`];
    for (let i = 0; i < this.rangeDays(); i++) {
      const date = addDays(this.start(), i);
      out.push({
        index: i, key: dayKey(date), date, day: date.getDate(), weekday: names[date.getDay()],
        isToday: dayKey(date) === this.todayKey, isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    return out;
  });

  /** Month names above the day numbers, each spanning its days. */
  readonly monthBands = computed(() => {
    const bands: { label: string; span: number }[] = [];
    for (const col of this.columns()) {
      const label = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(col.date);
      const last = bands[bands.length - 1];
      if (last && last.label === label) last.span++;
      else bands.push({ label, span: 1 });
    }
    return bands;
  });

  readonly periodLabel = computed(() => {
    const first = this.start();
    const last = addDays(first, this.rangeDays() - 1);
    const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
    const year = new Intl.DateTimeFormat(undefined, { year: 'numeric' }).format(last);
    return `${fmt.format(first)} – ${fmt.format(last)}, ${year}`;
  });

  readonly todayInView = computed(() => this.columns().some((c) => c.isToday));

  // ---- data (previous data stays on screen while a new window loads) ------------------------------------
  readonly rooms = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => this.roomService.getRooms(params.storeId!),
  });
  readonly roomTypes = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => this.roomService.getRoomTypes(params.storeId!),
  });
  readonly reservations = rxResource({
    params: () => {
      const first = this.start();
      return {
        storeId: this.storeStore.selectedStore()?._id,
        stayFrom: dayKey(first),
        stayTo: dayKey(addDays(first, this.rangeDays() - 1)),
      };
    },
    stream: ({ params }) =>
      this.reservationService.getReservations({ storeId: params.storeId!, stayFrom: params.stayFrom, stayTo: params.stayTo, limit: 1000 }),
  });
  readonly inventoryGrid = rxResource({
    params: () => {
      const first = this.start();
      return { storeId: this.storeStore.selectedStore()?._id, dateFrom: dayKey(first), dateTo: dayKey(addDays(first, this.rangeDays() - 1)) };
    },
    stream: ({ params }) => this.rateInventoryService.getInventoryGrid(params.storeId!, params.dateFrom, params.dateTo),
  });
  readonly overview = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => this.reservationService.getFrontDeskOverview(params.storeId!),
  });

  private lastReservations = signal<any>(null);
  private lastInventory = signal<any>(null);
  private keepLast = effect(() => {
    const r = this.reservations.value();
    if (r) this.lastReservations.set(r);
    const g = this.inventoryGrid.value();
    if (g) this.lastInventory.set(g);
  });

  readonly refreshing = computed(() => this.reservations.isLoading() || this.inventoryGrid.isLoading() || this.rooms.isLoading());
  readonly ready = computed(() => this.rooms.hasValue() && (this.reservations.hasValue() || !!this.lastReservations()));

  private reservationList = computed<any[]>(() => {
    const data = this.reservations.value() ?? this.lastReservations();
    return Array.isArray(data) ? data : data?.reservations || [];
  });

  /** Per room type per night: free rooms, restrictions and whether the type is closed to new bookings. */
  private inventoryCells = computed(() => {
    const grid: any = this.inventoryGrid.value() ?? this.lastInventory();
    const out = new Map<string, Map<string, { availability: number | null; badge: 'SS' | 'CTA' | 'CTD' | null; closed: boolean; rate: number | null; tip: string }>>();
    if (!grid?.grid) return out;
    for (const typeId of Object.keys(grid.grid)) {
      const typeGrid = grid.grid[typeId];
      const availability = typeGrid?.['_availability'] || {};
      const ratePlans = Object.keys(typeGrid).filter((k) => k !== '_availability');
      const byDay = new Map();
      for (const col of this.columns()) {
        const cell = availability[col.key] as AvailabilityCell | undefined;
        const restrictions: any = cell?.restrictions ?? null;
        const free = cell?.availability ?? null;
        let rate: number | null = null;
        for (const plan of ratePlans) {
          const rec = typeGrid[plan]?.[col.key];
          if (rec?.rate > 0) { rate = rec.rate; break; }
        }
        const badge = restrictions?.stopSell ? 'SS' : restrictions?.closedToArrival ? 'CTA' : restrictions?.closedToDeparture ? 'CTD' : null;
        const closed = !!restrictions?.stopSell || (free !== null && free <= 0);
        const tip = restrictions?.stopSell ? $localize`Stop sell` : free !== null && free <= 0 ? $localize`Sold out`
          : restrictions?.closedToArrival ? $localize`Closed to arrival` : restrictions?.closedToDeparture ? $localize`Closed to departure` : '';
        byDay.set(col.key, { availability: free, badge, closed, rate, tip });
      }
      out.set(typeId, byDay);
    }
    return out;
  });

  // ---- rows -----------------------------------------------------------------------------------------
  readonly rows = computed<Row[]>(() => {
    const rooms: any[] = this.rooms.value() ?? [];
    const types: any[] = this.roomTypes.value() ?? [];
    const hidden = this.hidden();
    const typeFilter = this.typeFilter();
    const collapsed = this.collapsed();
    const first = this.start();
    const days = this.rangeDays();

    const typeNames = new Map<string, string>();
    for (const t of types) if (t?._id) typeNames.set(t._id, t.name || $localize`Room`);

    const reservations = this.reservationList().filter((r) => !hidden.has(r.status));
    const assigned = reservations.filter((r) => r.rooms?.some((x: any) => x?.room?._id));
    const unassigned = reservations.filter(
      (r) => r.channex?.bookingId && (!r.rooms?.length || r.rooms.every((x: any) => !x?.room?._id)),
    );

    // Rooms grouped by type, in the order the API lists the types
    const groups = new Map<string, { name: string; rooms: any[] }>();
    for (const room of rooms) {
      const typeId = typeof room.roomType === 'string' ? room.roomType : room.roomType?._id;
      const name = (typeId && typeNames.get(typeId)) || room.roomType?.name || $localize`Room`;
      const key = typeId || name;
      if (typeFilter.size && !typeFilter.has(key)) continue;
      if (!groups.has(key)) groups.set(key, { name, rooms: [] });
      groups.get(key)!.rooms.push(room);
    }
    const order = [...types.map((t) => t._id).filter((id) => groups.has(id)), ...[...groups.keys()].filter((k) => !types.some((t) => t._id === k))];

    const out: Row[] = [];
    for (const key of order) {
      const group = groups.get(key)!;
      const roomRows: RoomRow[] = group.rooms.map((room) => {
        const bars: Bar[] = [];
        for (const r of assigned) {
          for (const assignment of (r.rooms || []).filter((x: any) => x?.room?._id === room._id)) {
            const bar = this.makeBar(r, assignment?.stayPeriod?.from || r.checkInDate, assignment?.stayPeriod?.to || r.checkOutDate, first, days, room._id, assignment?.assignedGuest || r.guest, `${r._id}:${assignment?._id ?? room._id}`);
            if (bar) bars.push(bar);
          }
        }
        const hk = room.housekeepingStatus || 'clean';
        return {
          kind: 'room', id: room._id, roomId: room._id, name: `${room.name ?? ''} ${room.roomNumber ?? ''}`.trim(), capacity: room.capacity || 2,
          typeId: typeof room.roomType === 'string' ? room.roomType : room.roomType?._id, typeName: group.name, hk, outOfOrder: hk === 'out_of_order', bars,
        };
      });

      const otaBars: Bar[] = [];
      for (const r of unassigned) {
        const wantsType = (r.rooms || []).some((x: any) => (typeof x.roomType === 'string' ? x.roomType : x.roomType?._id) === key);
        if (!wantsType) continue;
        const bar = this.makeBar(r, r.checkInDate, r.checkOutDate, first, days, null, r.guest, `${r._id}:ota:${key}`);
        if (bar) otaBars.push(bar);
      }

      // How many rooms are free each night: the channel manager's figure when there is one, otherwise what the grid shows.
      const inv = this.inventoryCells().get(key);
      const sellable = roomRows.filter((x) => !x.outOfOrder).length;
      const cells: GroupCell[] = this.columns().map((col) => {
        const info = inv?.get(col.key);
        let availability = info?.availability ?? null;
        if (availability === null) {
          const used = roomRows.filter((x) => !x.outOfOrder && x.bars.some((b) => this.barCoversNight(b, col.index))).length
            + otaBars.filter((b) => this.barCoversNight(b, col.index)).length;
          availability = Math.max(0, sellable - used);
        }
        return { availability, badge: info?.badge ?? null, closed: info?.closed ?? false, tip: info?.tip ?? '' };
      });

      const isCollapsed = collapsed.has(key);
      out.push({ kind: 'group', id: key, name: group.name, roomCount: group.rooms.length, collapsed: isCollapsed, cells });
      if (!isCollapsed) {
        out.push(...roomRows);
        if (otaBars.length) out.push({ kind: 'ota', id: `ota-${key}`, typeId: key, typeName: group.name, bars: otaBars });
      }
    }
    return out;
  });

  /** A bar covers night n when it starts at or before the middle of column n and ends after it. */
  private barCoversNight(bar: Bar, night: number): boolean {
    return bar.left <= night + 0.5 && bar.left + bar.width > night + 0.5;
  }

  readonly roomTypeOptions = computed(() => {
    const rooms: any[] = this.rooms.value() ?? [];
    const types: any[] = this.roomTypes.value() ?? [];
    const seen = new Set(rooms.map((r) => (typeof r.roomType === 'string' ? r.roomType : r.roomType?._id)));
    return types.filter((t) => seen.has(t._id)).map((t) => ({ id: t._id as string, name: t.name as string }));
  });

  readonly occupancy = computed(() => {
    const roomRows = this.rows().filter((r): r is RoomRow => r.kind === 'room');
    const otaRows = this.rows().filter((r): r is OtaRow => r.kind === 'ota');
    const stays = [...roomRows, ...otaRows].flatMap((r) => r.bars).map((b) => ({ checkIn: b.checkInKey, checkOut: b.checkOutKey }));
    const sellable = roomRows.filter((r) => !r.outOfOrder).length;
    return occupancyPerNight(stays, this.start(), this.rangeDays(), sellable);
  });

  readonly statusCounts = computed(() => {
    const counts: Partial<Record<StayStatus, number>> = {};
    for (const r of this.reservationList()) counts[r.status as StayStatus] = (counts[r.status as StayStatus] ?? 0) + 1;
    return counts;
  });

  readonly legend = (['confirmed', 'pending', 'checked_in', 'checked_out', 'reserved', 'no_show', 'cancelled'] as StayStatus[]).map((s) => ({
    status: s, color: STAY_COLORS[s], icon: STAY_ICONS[s], label: STATUS_LABELS[s](),
  }));

  readonly housekeepingOptions = [
    { key: 'clean', label: $localize`Clean`, icon: 'check_circle' },
    { key: 'dirty', label: $localize`Dirty`, icon: 'warning' },
    { key: 'inspected', label: $localize`Inspected`, icon: 'verified' },
    { key: 'out_of_order', label: $localize`Out of Order`, icon: 'do_not_disturb' },
  ];

  readonly matchCount = computed(() => {
    const term = this.search().trim();
    if (!term) return 0;
    return this.rows().reduce((n, r) => n + (r.kind === 'group' ? 0 : r.bars.filter((b) => !this.isDim(b)).length), 0);
  });

  /** The numbers a front-desk agent looks at first: from the property overview, plus how full tonight is. */
  readonly kpis = computed(() => {
    const stats = this.overview.value()?.stats;
    const todayCol = this.columns().find((c) => c.isToday);
    const occ = todayCol ? this.occupancy()[todayCol.index] : null;
    return {
      arrivals: stats?.totalArrivals ?? null,
      departures: stats?.totalDepartures ?? null,
      inHouse: stats?.totalInHouse ?? null,
      occupancy: occ?.percent ?? null,
    };
  });

  // ---- building a bar ---------------------------------------------------------------------------------
  private makeBar(reservation: any, checkIn: any, checkOut: any, windowStart: Date, days: number, roomId: string | null, guestSource: any, key: string): Bar | null {
    const layout = layoutBar(checkIn, checkOut, windowStart, days);
    if (!layout) return null;
    const status = (reservation.status as StayStatus) in STAY_COLORS ? (reservation.status as StayStatus) : 'confirmed';
    const g = guestSource || {};
    const guest = g.companyName ? g.companyName : `${g.firstName || ''} ${g.lastName || ''}`.trim() || $localize`Guest`;
    const sourceKey = String(reservation.bookingSource || '').toLowerCase();
    const balance = Number(reservation.pricing?.balance) || 0;
    const source = (SOURCE_NAMES[sourceKey] ?? SOURCE_NAMES['direct'])();
    const urgency = urgencyOf(status, checkIn, checkOut, this.today);
    const ci = parseDay(checkIn);
    const co = parseDay(checkOut);
    const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const lines = [
      `${guest}${reservation.bookingType === 'group' ? ' (' + $localize`Group` + ')' : ''}`,
      `${fmt.format(ci)} → ${fmt.format(co.getTime() <= ci.getTime() ? addDays(ci, 1) : co)} · ${layout.nights} ${layout.nights === 1 ? $localize`night` : $localize`nights`}`,
      `${STATUS_LABELS[status]()} · ${source}`,
    ];
    if (reservation.confirmationNumber) lines.push(`#${reservation.confirmationNumber}`);
    if (balance > 0 && status !== 'cancelled') lines.push($localize`Balance due: ${balance}`);
    if (urgency === 'arriving') lines.push($localize`Arriving today`);
    if (urgency === 'departing') lines.push($localize`Leaving today`);
    if (urgency === 'overdue') lines.push($localize`Still in the room after check-out day`);
    if (urgency === 'late') lines.push($localize`Arrival day has passed and the guest has not checked in`);
    return {
      key, reservation, roomId, ...layout, status, statusLabel: STATUS_LABELS[status](), icon: STAY_ICONS[status], color: STAY_COLORS[status],
      guest, isGroup: reservation.bookingType === 'group', modified: !!reservation.modification?.isModified, balance: status === 'cancelled' ? 0 : balance,
      urgency, source, sourceLogo: SOURCE_LOGOS[sourceKey] ?? null, checkInKey: dayKey(ci), checkOutKey: dayKey(co.getTime() <= ci.getTime() ? addDays(ci, 1) : co),
      haystack: `${guest} ${reservation.confirmationNumber ?? ''} ${source} ${g.email ?? ''} ${g.phone ?? ''}`.toLowerCase(), tooltip: lines.join('\n'),
    };
  }

  /** Bars that don't match the search or the highlighted KPI fade back, so the ones that do stand out. */
  isDim(bar: Bar): boolean {
    const term = this.search().trim().toLowerCase();
    if (term && !bar.haystack.includes(term)) return true;
    switch (this.focus()) {
      case 'arrivals': return bar.checkInKey !== this.todayKey;
      case 'departures': return bar.checkOutKey !== this.todayKey;
      case 'inhouse': return bar.status !== 'checked_in';
      default: return false;
    }
  }

  // ---- navigation & controls ---------------------------------------------------------------------------
  shift(days: number): void {
    this.start.set(addDays(this.start(), days));
  }

  goToday(): void {
    this.start.set(addDays(this.today, -1));
  }

  jump(value: string): void {
    if (!value) return;
    this.start.set(addDays(parseDay(value), -1));
  }

  setRange(days: RangeDays): void {
    this.rangeDays.set(days);
  }

  toggleStatus(status: StayStatus): void {
    const next = new Set(this.hidden());
    if (next.has(status)) next.delete(status);
    else next.add(status);
    this.hidden.set(next);
  }

  toggleType(id: string): void {
    const next = new Set(this.typeFilter());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.typeFilter.set(next);
  }

  clearTypes(): void {
    this.typeFilter.set(new Set());
  }

  toggleCollapsed(id: string): void {
    const next = new Set(this.collapsed());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.collapsed.set(next);
  }

  collapseAll(collapse: boolean): void {
    this.collapsed.set(collapse ? new Set(this.rows().filter((r) => r.kind === 'group').map((r) => r.id)) : new Set());
  }

  allCollapsed = computed(() => {
    const groups = this.rows().filter((r) => r.kind === 'group');
    return groups.length > 0 && groups.every((g) => (g as GroupRow).collapsed);
  });

  setFocus(focus: Focus): void {
    this.focus.set(this.focus() === focus ? null : focus);
    if (this.focus() && !this.todayInView()) this.goToday();
  }

  setDensity(density: Density): void {
    this.density.set(density);
  }

  resetView(): void {
    this.search.set('');
    this.focus.set(null);
    this.typeFilter.set(new Set());
    this.hidden.set(new Set(['cancelled', 'no_show']));
    this.collapsed.set(new Set());
    this.goToday();
  }

  reload(): void {
    this.reservations.reload();
    this.inventoryGrid.reload();
    this.rooms.reload();
    this.overview.reload();
  }

  // ---- housekeeping ------------------------------------------------------------------------------------
  hkLabel(status: string): string {
    return this.housekeepingOptions.find((o) => o.key === status)?.label ?? status;
  }

  hkClass(status: string): string {
    return `hk-${status}`;
  }

  updateHousekeeping(roomId: string, status: string): void {
    this.roomService.updateHousekeepingStatus(roomId, status as any).subscribe({
      next: () => this.rooms.reload(),
      error: () => this.snackBar.open($localize`Could not update the room status.`, $localize`Close`, { duration: 4000 }),
    });
  }

  // ---- opening things ---------------------------------------------------------------------------------
  openReservation(bar: Bar, row: RoomRow | OtaRow): void {
    this.dialog.open(ReservationPreviewDialogComponent, {
      width: '700px',
      maxWidth: '96vw',
      data: { reservation: bar.reservation, room: { name: row.kind === 'room' ? row.name : undefined, id: row.kind === 'room' ? row.roomId : undefined } },
    });
  }

  createReservation(): void {
    this.dialog
      .open(QuickReservationModalComponent, { width: '600px', maxWidth: '96vw' })
      .afterClosed()
      .subscribe((result: QuickReservationData | undefined) => this.continueToForm(result));
  }

  private continueToForm(result: QuickReservationData | undefined): void {
    if (!result) return;
    this.router.navigate(['../create'], { relativeTo: this.route.parent, queryParams: { quickReservation: JSON.stringify(result) } });
  }

  navigateToView(view: 'list' | 'calendar'): void {
    this.router.navigate([view], { relativeTo: this.route.parent });
  }

  // ---- drag to book ------------------------------------------------------------------------------------
  /** Which day column a pointer is over, from its position inside a row's track. */
  private columnAt(event: PointerEvent): number {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const col = Math.floor((event.clientX - rect.left) / this.dayWidth());
    return Math.min(this.rangeDays() - 1, Math.max(0, col));
  }

  trackDown(event: PointerEvent, row: RoomRow): void {
    if (event.button !== 0 || (event.target as HTMLElement).closest('.tc-bar')) return;
    const from = this.columnAt(event);
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.selection.set(this.evaluate(row, from, from));
  }

  trackMove(event: PointerEvent, row: RoomRow): void {
    const col = this.columnAt(event);
    this.hoverCol.set(col);
    const current = this.selection();
    if (!current || current.rowId !== row.id) return;
    if (col !== current.to) this.selection.set(this.evaluate(row, current.from, col));
  }

  trackUp(event: PointerEvent): void {
    const current = this.selection();
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    this.selection.set(null);
    if (!current) return;
    if (!current.ok) {
      this.snackBar.open(current.reason, $localize`Close`, { duration: 3500 });
      return;
    }
    const first = Math.min(current.from, current.to);
    const last = Math.max(current.from, current.to);
    const checkIn = addDays(this.start(), first);
    const checkOut = addDays(this.start(), last + 1);
    const data: QuickReservationDialogData = {
      checkInDate: checkIn,
      checkOutDate: checkOut,
      preselectedRoomId: current.roomId,
      preselectedRoomName: current.roomName,
      preselectedRoomTypeId: current.typeId ?? undefined,
      preselectedRoomTypeName: current.typeName,
    };
    this.dialog
      .open(QuickReservationModalComponent, { width: '600px', maxWidth: '96vw', data })
      .afterClosed()
      .subscribe((result: QuickReservationData | undefined) => this.continueToForm(result));
  }

  trackCancel(): void {
    this.selection.set(null);
  }

  /** Can these nights be booked in this room, and if not, why not (in words the agent can act on). */
  private evaluate(row: RoomRow, a: number, b: number): Selection {
    const from = Math.min(a, b);
    const to = Math.max(a, b);
    const checkIn = addDays(this.start(), from);
    const checkOut = addDays(this.start(), to + 1);
    let reason = '';
    if (checkIn.getTime() < this.today.getTime()) reason = $localize`Dates in the past cannot be booked.`;
    else if (row.outOfOrder) reason = $localize`This room is out of order.`;
    else if (overlapsAny(row.bars.map((x) => ({ checkIn: x.checkInKey, checkOut: x.checkOutKey })), checkIn, checkOut)) reason = $localize`This room is already booked for those nights.`;
    else {
      const inv = row.typeId ? this.inventoryCells().get(row.typeId) : undefined;
      for (let i = from; i <= to && !reason; i++) {
        const info = inv?.get(this.columns()[i].key);
        if (info?.closed) reason = $localize`${row.typeName} is closed for sale on ${this.columns()[i].key}.`;
      }
      if (!reason) {
        const ota = this.rows().find((r): r is OtaRow => r.kind === 'ota' && r.typeId === row.typeId);
        if (ota && overlapsAny(ota.bars.map((x) => ({ checkIn: x.checkInKey, checkOut: x.checkOutKey })), checkIn, checkOut)) {
          reason = $localize`Unassigned channel bookings already use up this room type for those nights.`;
        }
      }
    }
    return { rowId: row.id, roomId: row.roomId, roomName: row.name, typeId: row.typeId, typeName: row.typeName, from: a, to: b, ok: !reason, reason };
  }

  /** Where the live selection is drawn, in day-columns. */
  selectionBox(row: RoomRow): { left: number; width: number; ok: boolean } | null {
    const s = this.selection();
    if (!s || s.rowId !== row.id) return null;
    const first = Math.min(s.from, s.to);
    const last = Math.max(s.from, s.to);
    return { left: first + 0.5, width: last - first + 1, ok: s.ok };
  }

  trackRow = (_: number, row: Row) => row.id;
  trackBar = (_: number, bar: Bar) => bar.key;

  private readPrefs(): { days: RangeDays; density: Density; hidden: StayStatus[] } {
    const fallback = { days: 14 as RangeDays, density: 'comfortable' as Density, hidden: ['cancelled', 'no_show'] as StayStatus[] };
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
      if (!saved) return fallback;
      return {
        days: [7, 14, 30].includes(saved.days) ? saved.days : fallback.days,
        density: saved.density === 'compact' ? 'compact' : 'comfortable',
        hidden: Array.isArray(saved.hidden) ? saved.hidden : fallback.hidden,
      };
    } catch {
      return fallback;
    }
  }
}
