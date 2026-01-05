import { Component, inject, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { CdkMenuModule } from '@angular/cdk/menu';
import { QuickReservationModalComponent, QuickReservationData, QuickReservationDialogData } from '../../quick-reservation-modal/quick-reservation-modal.component';
import { ReservationPreviewDialogComponent } from '../reservation-preview-dialog/reservation-preview-dialog.component';
import { StoreStore } from '../../../../../../shared/stores/store.store';
import { ReservationService } from '../../../../../../shared/services/reservation.service';
import { RoomsService } from '../../../../../../shared/services/rooms.service';
import { PageHeaderComponent } from '../../../../../../shared/components/page-header/page-header.component';
import { rxResource } from '@angular/core/rxjs-interop';
import type { Reservation, ReservationStatus } from '../../../../../../shared/models/reservation.model';

interface DateRange {
  key: string;
  day: number;
  dayName: string;
  date: Date;
}

interface RoomWithReservations {
  roomId: string;
  roomName: string;
  capacity: number;
  reservations: any[];
}

// Represents a single room stay (per room within a reservation)
interface RoomStay {
  reservationId: string;
  roomAssignmentId?: string;
  checkInDate: string | Date;
  checkOutDate: string | Date;
  guest?: any;
  status?: string;
  bookingType?: string;
  confirmationNumber?: string;
  reservation?: any; // original reservation reference, if needed
}

// Drag selection state interface
interface DragSelection {
  isSelecting: boolean;
  startDate: Date | null;
  endDate: Date | null;
  roomId: string | null;
  roomName: string | null;
  roomTypeId: string | null;
  roomTypeName: string | null;
  hasConflict: boolean;
}

@Component({
  selector: 'app-reservations-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    CdkMenuModule,
    PageHeaderComponent,
  ],
  templateUrl: './reservations-calendar.html',
  styleUrl: './reservations-calendar.scss',
})
export class ReservationsCalendar implements OnInit {
  public storeStore = inject(StoreStore);
  public reservationService = inject(ReservationService);
  public roomService = inject(RoomsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // Signals
  public viewMode = signal<'weekly' | 'monthly'>('monthly');
  private startDate = signal<Date>(new Date());
  public selectedStatus = signal<ReservationStatus | 'all'>('all');
  public excludedStatuses = signal<Set<ReservationStatus>>(
    new Set(['checked_out', 'cancelled', 'no_show'])
  );
  
  // Drag selection signal for click-and-drag room booking
  public dragSelection = signal<DragSelection>({
    isSelecting: false,
    startDate: null,
    endDate: null,
    roomId: null,
    roomName: null,
    roomTypeId: null,
    roomTypeName: null,
    hasConflict: false,
  });

  // Track hovered date for column highlighting
  public hoveredDateKey = signal<string | null>(null);

  public reservationStatuses: ReservationStatus[] = [
    'pending',
    'confirmed',
    'checked_in',
    'checked_out',
    'cancelled',
    'no_show',
    'reserved',
  ];

  public housekeepingStatuses = [
    { key: 'clean', label: 'Clean' },
    { key: 'dirty', label: 'Dirty' },
    { key: 'inspected', label: 'Inspected' },
    { key: 'out_of_order', label: 'Out of Order' },
  ];

  private statusColorMap: Record<ReservationStatus, string> = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-blue-600',
    checked_in: 'bg-green-600',
    checked_out: 'bg-gray-500',
    cancelled: 'bg-red-600',
    no_show: 'bg-orange-600',
    reserved: 'bg-indigo-600',
  };

  public dateRange = computed(() => {
    const dates: DateRange[] = [];
    const mode = this.viewMode();
    const start = this.alignStartOfPeriod(this.startDate(), mode);

    if (mode === 'weekly') {
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        dates.push({
          key: d.toISOString().slice(0, 10),
          day: d.getDate(),
          dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
          date: new Date(d),
        });
      }
    } else {
      // monthly
      const year = start.getFullYear();
      const month = start.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 0; i < daysInMonth; i++) {
        const d = new Date(year, month, i + 1);
        dates.push({
          key: d.toISOString().slice(0, 10),
          day: d.getDate(),
          dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
          date: new Date(d),
        });
      }
    }
    return dates;
  });


  // Resources
  public rooms = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) => this.roomService.getRooms(params.storeId!),
  });

  public reservations = rxResource({
    params: () => {
      const storeId = this.storeStore.selectedStore()?._id;
      const mode = this.viewMode();
      const start = this.alignStartOfPeriod(this.startDate(), mode);
      const { dateFrom, dateTo } = this.getPeriodDateRangeStrings(start, mode);
      const statusSel = this.selectedStatus();
      const status = statusSel === 'all' ? undefined : statusSel;
      return { storeId, dateFrom, dateTo, status };
    },
    stream: ({ params }) =>
      this.reservationService.getReservations({
        storeId: params.storeId!,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        status: params.status,
      }),
  });

  public roomTypes = rxResource({
    params: () => ({ storeId: this.storeStore.selectedStore()?._id }),
    stream: ({ params }) =>
      this.roomService.getRoomTypes(params.storeId!),
  });

  // Computed signal for grouped rooms with reservations
  public roomsWithReservations = computed(() => {
    const rooms = this.rooms.value() || [];
    const types = this.roomTypes.value() || [];
    const reservationsData = this.reservations.value();
    const reservationsList = Array.isArray(reservationsData)
      ? reservationsData
      : reservationsData?.reservations || [];
    const excluded = this.excludedStatuses();

    // Filter out reservations that are in excluded statuses
    const filteredReservations = reservationsList.filter((r: any) => {
      // If a specific status is selected (not 'all'), only include that status
      if (this.selectedStatus() !== 'all') {
        return r.status === this.selectedStatus();
      }
      // Otherwise, exclude the statuses in the excludedStatuses set
      return !excluded.has(r.status);
    });

    // Map typeId -> typeName from API
    const typesById = new Map<string, string>();
    for (const t of types as any[]) {
      if (t && t._id) typesById.set(t._id, t.name || 'Room');
    }

    // Build groups: key by typeId if available, fallback to typeName
    const groupsMap = new Map<string, { typeName: string; rooms: any[] }>();
    for (const room of rooms) {
      let typeId: string | undefined;
      let typeName: string = 'Room';
      if (typeof room.roomType === 'string') {
        typeId = room.roomType;
        typeName = typesById.get(room.roomType) || room.roomType;
      } else if (room.roomType) {
        typeId = room.roomType._id;
        typeName = room.roomType.name || 'Room';
      }
      const key = typeId || typeName;
      if (!groupsMap.has(key)) groupsMap.set(key, { typeName, rooms: [] });
      groupsMap.get(key)!.rooms.push(room);
    }

    // Order types: prefer API order, then any leftover keys
    const orderedKeys: string[] = [];
    for (const t of types as any[]) {
      if (t && t._id && groupsMap.has(t._id)) orderedKeys.push(t._id);
    }
    for (const key of groupsMap.keys()) {
      if (!orderedKeys.includes(key)) orderedKeys.push(key);
    }

    // Build interleaved array of group headers + room rows
    const result: Array<any> = [];
    for (const key of orderedKeys) {
      const group = groupsMap.get(key);
      if (!group) continue;
      result.push({ isGroup: true, roomTypeName: group.typeName });
      for (const room of group.rooms) {
        // Build per-room stays using the room's own assignment dates (stayPeriod.from/to)
        const stays: RoomStay[] = [];
        for (const r of filteredReservations as any[]) {
          if (!r?.rooms) continue;
          const matchingAssignments = r.rooms.filter((rr: any) => rr?.room?._id === room._id);
          if (!matchingAssignments?.length) continue;
          for (const rr of matchingAssignments) {
            const checkIn = rr?.stayPeriod?.from || r.checkInDate;
            const checkOut = rr?.stayPeriod?.to || r.checkOutDate;
            // Prefer assignedGuest from the room assignment; fallback to reservation guest for older data
            const guestForRoom = rr?.assignedGuest || r.guest;
            stays.push({
              reservationId: r._id,
              roomAssignmentId: rr?._id,
              checkInDate: checkIn,
              checkOutDate: checkOut,
              guest: guestForRoom,
              status: r.status,
              bookingType: r.bookingType,
              confirmationNumber: r.confirmationNumber,
              reservation: r,
            });
          }
        }

        result.push({
          isGroup: false,
          roomId: room._id,
          roomName: `${room.name} ${room.roomNumber ?? ''}`,
          roomTypeId: typeof room.roomType === 'string' ? room.roomType : room.roomType?._id,
          roomTypeName: group.typeName,
          capacity: room.capacity || 2,
          housekeepingStatus: room.housekeepingStatus || 'clean',
          reservations: stays,
        });
      }
    }
    return result;
  });

   confirmedCount = computed(() => {
    return this.reservations.value()?.reservations.filter(r => r.status === 'confirmed').length;
  });

  checkedInCount = computed(() => {
    return this.reservations.value()?.reservations.filter(r => r.status === 'checked_in').length;
  });

  pendingCount = computed(() => {
    return this.reservations.value()?.reservations.filter(r => r.status === 'pending').length;
  });

  cancelledCount = computed(() => {
    return this.reservations.value()?.reservations.filter(r => r.status === 'cancelled').length;
  });

  totalRevenue = computed(() => {
    return this.reservations.value()?.reservations.reduce((sum, r) => sum + this.getEffectiveTotal(r), 0);
  });

  getEffectiveTotal(reservation: Reservation): number {
      // The pricing.total already includes approved extension costs (updated by backend)
      return reservation.pricing?.total || 0;
    }

  ngOnInit() {
    // Initialize start date aligned to current month (default view)
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate.set(monthStart);
  }

  reloadData() {
    this.reservations.reload();
  }

  clearFilters() {
    // Reset view mode to monthly
    this.viewMode.set('monthly');
    // Reset status filter to show all
    this.selectedStatus.set('all');
    // Reset date range to current month
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate.set(monthStart);
  }

  createReservation() {
    const dialogRef = this.dialog.open(QuickReservationModalComponent, {
      width: '600px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result: QuickReservationData | undefined) => {
      if (result) {
        this.router.navigate(['../create'], {
          relativeTo: this.route.parent,
          queryParams: { quickReservation: JSON.stringify(result) },
        });
      }
    });
  }

  /** Human-readable label for the current view period (start – end, local) */
  public getPeriodLabel(): string {
    const mode = this.viewMode();
    const start = this.alignStartOfPeriod(this.startDate(), mode);
    let end = new Date(start);
    if (mode === 'weekly') {
      end.setDate(end.getDate() + 6);
    } else {
      // monthly: last day of the same month
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      end.setHours(0, 0, 0, 0);
    }
    const fmt = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  }

  /**
   * Check if a reservation spans across a specific date
   */
  isReservationOnDate(reservation: any, date: DateRange): boolean {
    const checkIn = new Date(reservation.checkInDate);
    const checkOut = new Date(reservation.checkOutDate);
    
    // Remove time component for date comparison
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);
    const compareDate = new Date(date.date);
    compareDate.setHours(0, 0, 0, 0);
    
    return compareDate >= checkIn && compareDate < checkOut;
  }

  /**
   * Check if reservation starts on the given date (normalized)
   */
  isReservationStartingOnDate(reservation: any, date: DateRange): boolean {
    const checkIn = this.parseDateOnly(reservation.checkInDate);
    const compareDate = this.parseDateOnly(date.date);
    return compareDate.getTime() === checkIn.getTime();
  }

  /**
   * Check if the reservation block should render starting from this date.
   * Returns true if:
   * - Reservation starts on this date, OR
   * - Reservation spans across this date AND this is the first visible date in the current range
   * This ensures multi-day reservations spanning month/week boundaries display correctly.
   */
  shouldRenderReservationFromDate(reservation: any, date: DateRange): boolean {
    const checkIn = this.parseDateOnly(reservation.checkInDate);
    const checkOut = this.parseDateOnly(reservation.checkOutDate);
    const compareDate = this.parseDateOnly(date.date);

    // Case 1: Reservation starts on this date
    if (compareDate.getTime() === checkIn.getTime()) {
      return true;
    }

    // Case 2: Reservation spans this date AND this is the first visible date
    // (means the reservation started before the current view)
    const dates = this.dateRange();
    if (Array.isArray(dates) && dates.length > 0) {
      const firstVisible = this.parseDateOnly(dates[0].date);
      // If this date is the first visible date AND the reservation spans it (started before and ends after/on it)
      if (compareDate.getTime() === firstVisible.getTime() && compareDate >= checkIn && compareDate < checkOut) {
        return true;
      }
    }

    return false;
  }

  /**
   * Parse a date string and extract just the date portion (ignoring time/timezone)
   * This handles ISO strings like "2026-01-04T00:00:00.000Z"
   */
  private parseDateOnly(dateInput: string | Date): Date {
    if (dateInput instanceof Date) {
      return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
    }
    // For ISO strings, extract the date portion directly to avoid timezone shifts
    const dateStr = String(dateInput);
    if (dateStr.includes('T') || dateStr.includes('Z')) {
      // ISO format: "2026-01-04T00:00:00.000Z" - extract "2026-01-04"
      const datePart = dateStr.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // Fallback for other formats
    const d = new Date(dateInput);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  /**
   * Calculate the width in pixels of the reservation block based on duration
   * Note: The checkout date is exclusive - guest checks out on that day but doesn't occupy the room
   */
  getReservationWidth(reservation: any, date: DateRange): number {
    const cellWidth = this.cellWidthPx();

    // Parse dates properly to avoid timezone issues
    const checkInNorm = this.parseDateOnly(reservation.checkInDate);
    const checkOutNorm = this.parseDateOnly(reservation.checkOutDate);
    const compareDateNorm = this.parseDateOnly(date.date);

    // If current cell date is before the check-in, nothing to render
    if (compareDateNorm < checkInNorm) return 0;

    // Start drawing from the later of the cell date or the check-in
    const startDate = compareDateNorm > checkInNorm ? compareDateNorm : checkInNorm;

    // The checkout date is exclusive (guest doesn't occupy room on checkout day)
    // So we draw up to checkOut - 1 day as the last occupied cell
    const lastOccupiedDate = new Date(checkOutNorm);
    lastOccupiedDate.setDate(lastOccupiedDate.getDate() - 1);

    // Clamp the end to the visible range
    const dates = this.dateRange();
    let endDate = lastOccupiedDate;
    if (Array.isArray(dates) && dates.length > 0) {
      const lastVisible = this.parseDateOnly(dates[dates.length - 1].date);
      endDate = endDate < lastVisible ? endDate : lastVisible;
    }

    // Calculate duration in days (inclusive of both start and end)
    const msPerDay = 1000 * 60 * 60 * 24;
    const durationDays = Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
    
    if (durationDays <= 0) return 0;

    // Width calculation:
    // Each cell is cellWidth px + 1px border (shared/collapsed with adjacent cell)
    // For N cells: N * cellWidth + (N-1) * 1px for internal borders
    // Subtract a small amount to prevent overflow into next cell
    const borderWidth = 1;
    const width = (durationDays * cellWidth) + ((durationDays - 1) * borderWidth) - 2;
    return Math.max(width, cellWidth - 4); // Minimum width of one cell minus padding
  }

  /**
   * Get dynamic styling for reservation blocks
   */
  getReservationStyle(reservation: any): string {
    const status = (reservation?.status || 'reserved') as ReservationStatus;
    return this.statusColorMap[status] || 'bg-gray-500';
  }

  public getStatusColorClass(status: ReservationStatus): string {
    return this.statusColorMap[status] || 'bg-gray-500';
  }

  /** Get background color class based on housekeeping status */
  public getHousekeepingStatusClass(status: string): string {
    const colorMap: Record<string, string> = {
      'clean': 'bg-green-100 border-l-4 border-l-green-500',
      'dirty': 'bg-amber-100 border-l-4 border-l-amber-500',
      'inspected': 'bg-blue-100 border-l-4 border-l-blue-500',
      'out_of_order': 'bg-red-100 border-l-4 border-l-red-500',
    };
    return colorMap[status] || 'bg-gray-50';
  }

  /** Get icon for housekeeping status */
  public getHousekeepingStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      'clean': 'check_circle',
      'dirty': 'warning',
      'inspected': 'verified',
      'out_of_order': 'do_not_disturb',
    };
    return iconMap[status] || 'help';
  }

  /** Update housekeeping status for a room */
  public updateHousekeepingStatus(roomId: string, status: string): void {
    this.roomService.updateHousekeepingStatus(roomId, status as any).subscribe({
      next: () => {
        // Reload rooms to reflect the update
        this.rooms.reload();
      },
      error: (err) => {
        console.error('Failed to update housekeeping status:', err);
      }
    });
  }

  /** Navigate to previous period based on view mode */
  previousWeek() {
    const mode = this.viewMode();
    const date = new Date(this.startDate());
    if (mode === 'weekly') {
      date.setDate(date.getDate() - 7);
    } else {
      // monthly
      date.setMonth(date.getMonth() - 1);
    }
    this.startDate.set(this.alignStartOfPeriod(date, mode));
  }

  /** Navigate to next period based on view mode */
  nextWeek() {
    const mode = this.viewMode();
    const date = new Date(this.startDate());
    if (mode === 'weekly') {
      date.setDate(date.getDate() + 7);
    } else {
      // monthly
      date.setMonth(date.getMonth() + 1);
    }
    this.startDate.set(this.alignStartOfPeriod(date, mode));
  }

  /** Go to current period start */
  goToToday() {
    const today = new Date();
    this.startDate.set(this.alignStartOfPeriod(today, this.viewMode()));
  }

  /** Change view mode and align start date */
  onViewModeChange(mode: 'weekly' | 'monthly') {
    this.viewMode.set(mode);
    this.goToToday();
  }

  /** Change status filter */
  onStatusChange(status: ReservationStatus | 'all') {
    this.selectedStatus.set(status);
  }

  /** Helper: align a date to the start of its period */
  private alignStartOfPeriod(date: Date, mode: 'weekly' | 'monthly') {
    const d = new Date(date);
    if (mode === 'weekly') {
      // Start at current day, normalized (7 days from here)
      d.setHours(0, 0, 0, 0);
      return d;
    }
    // monthly
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  /** Helper: get dateFrom/dateTo strings (YYYY-MM-DD) for current period */
  private getPeriodDateRangeStrings(start: Date, mode: 'weekly' | 'monthly') {
    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);
    let endDay = new Date(startDay);
    if (mode === 'weekly') {
      endDay.setDate(endDay.getDate() + 6);
    } else {
      // monthly: end is last day of month
      endDay = new Date(startDay.getFullYear(), startDay.getMonth() + 1, 0);
      endDay.setHours(0, 0, 0, 0);
    }
    const df = startDay.toISOString().split('T')[0];
    const dt = endDay.toISOString().split('T')[0];
    return { dateFrom: df, dateTo: dt };
  }

  /** Tooltip content for a reservation block */
  getReservationTooltip(reservation: any, roomName?: string): string {
    const guest = reservation.guest?.firstName && reservation.guest?.lastName
      ? `${reservation.guest.firstName} ${reservation.guest.lastName}`
      : (reservation.guestName || 'Guest');
    const room = roomName || 'Room';
    const checkIn = new Date(reservation.checkInDate);
    const checkOut = new Date(reservation.checkOutDate);
    const fmt: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: '2-digit' };
    const ci = checkIn.toLocaleDateString(undefined, fmt);
    const co = checkOut.toLocaleDateString(undefined, fmt);
    return `${room} | ${guest} | Check-in: ${ci} | Check-out: ${co}`;
  }

  /** Fixed cell width per mode (px) */
  public cellWidthPx(): number {
    const mode = this.viewMode();
    if (mode === 'weekly') return 160; // standard week cell width
    return 80; // compact monthly cells (wider)
  }

  /** Gap between cells per mode (px) */
  public cellGapPx(): number {
    const mode = this.viewMode();
    if (mode === 'weekly') return 4;
    return 2;
  }

  /** Number of reservations starting on a specific date within a row */
  public getCellReservationsCount(reservations: any[], date: DateRange): number {
    return (reservations || []).filter(r => this.isReservationStartingOnDate(r, date)).length;
  }

  /** Stack index for the reservation among those starting on the same date */
  public getCellStackIndex(reservations: any[], date: DateRange, reservation: any): number {
    const starters = (reservations || []).filter(r => this.isReservationStartingOnDate(r, date));
    // Try to identify uniquely using assignment + reservation ids if present
    const idx = starters.findIndex(r => (
      r === reservation ||
      (r.roomAssignmentId && reservation.roomAssignmentId && r.roomAssignmentId === reservation.roomAssignmentId) ||
      (r.reservationId && reservation.reservationId && r.reservationId === reservation.reservationId)
    ));
    return idx >= 0 ? idx : 0;
  }

  /** Top offset percent for a reservation in a cell based on local stacking */
  public getReservationTopPercent(reservations: any[], date: DateRange, reservation: any): number {
    const count = this.getCellReservationsCount(reservations, date);
    if (count <= 1) return 0;
    const idx = this.getCellStackIndex(reservations, date, reservation);
    return (idx * (100 / count));
  }

  /** Height percent each reservation should occupy in a cell */
  public getReservationHeightPercent(reservations: any[], date: DateRange): number {
    const count = this.getCellReservationsCount(reservations, date);
    return 100 / (count || 1);
  }

  /** Determine if a reservation is a group reservation */
  public isGroupReservation(reservation: any): boolean {
    if (!reservation) return false;
    const r = reservation;
    return (
      r.reservationType === 'group' ||
      r.bookingType === 'group' ||
      r.groupReservation === true ||
      r.guest?.type === 'group' ||
      r.guest?.guestType === 'group' ||
      !!r.guest?.companyName
    );
  }

  /** Label for reservation block, prefix 'G' for group reservations */
  public getReservationBlockLabel(reservation: any): string {
    const g = reservation?.guest || {};
    const name = `${g.firstName || ''} ${g.lastName || ''}`.trim() || 'Guest';
    const prefix = this.isGroupReservation(reservation) ? '(G)' : '';
    return `${prefix} ${name}`;
  }

  /** Open reservation preview dialog with the full reservation object */
  openReservationPreview(reservation: any, row: any) {
    if (!reservation) return;
    this.dialog.open(ReservationPreviewDialogComponent, {
      width: '700px',
      data: { reservation, room: { name: row?.roomName, id: row?.roomId } },
    });
  }

  // ========== Drag Selection Methods ==========

  /** Check if a specific date has a reservation conflict for a room */
  public hasReservationOnDate(roomId: string, date: Date): boolean {
    const rooms = this.roomsWithReservations();
    const roomRow = rooms.find((r: any) => !r.isGroup && r.roomId === roomId);
    if (!roomRow || !roomRow.reservations) return false;

    const checkDate = this.parseDateOnly(date);

    return roomRow.reservations.some((res: any) => {
      const checkIn = this.parseDateOnly(res.checkInDate);
      const checkOut = this.parseDateOnly(res.checkOutDate);
      // A date is occupied if it's >= checkIn and < checkOut
      return checkDate >= checkIn && checkDate < checkOut;
    });
  }

  /** Check if any date in a range has conflicts */
  public hasConflictInRange(roomId: string, startDate: Date, endDate: Date): boolean {
    const start = new Date(Math.min(startDate.getTime(), endDate.getTime()));
    const end = new Date(Math.max(startDate.getTime(), endDate.getTime()));
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const current = new Date(start);
    while (current <= end) {
      if (this.hasReservationOnDate(roomId, current)) {
        return true;
      }
      current.setDate(current.getDate() + 1);
    }
    return false;
  }

  /** Start drag selection on mousedown */
  public onCellMouseDown(event: MouseEvent, date: DateRange, row: any): void {
    // Only start if it's a room row (not a group header)
    if (row.isGroup) return;
    
    // Prevent text selection during drag
    event.preventDefault();

    // Check for conflicts on selected date AND next day (minimum 1 night = 2 days highlighted)
    const selectedDate = new Date(date.date);
    const nextDay = new Date(date.date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const hasConflict = this.hasReservationOnDate(row.roomId, selectedDate) || 
                        this.hasReservationOnDate(row.roomId, nextDay);

    this.dragSelection.set({
      isSelecting: true,
      startDate: new Date(date.date),
      endDate: new Date(date.date),
      roomId: row.roomId,
      roomName: row.roomName,
      roomTypeId: row.roomTypeId || null,
      roomTypeName: row.roomTypeName || null,
      hasConflict,
    });
  }

  /** Extend selection on mousemove/mouseenter */
  public onCellMouseEnter(date: DateRange, row: any): void {
    const selection = this.dragSelection();
    if (!selection.isSelecting) return;
    
    // Only extend selection for the same room
    if (row.roomId !== selection.roomId) return;

    const newEndDate = new Date(date.date);
    const hasConflict = this.hasConflictInRange(
      selection.roomId!,
      selection.startDate!,
      newEndDate
    );

    this.dragSelection.update(s => ({
      ...s,
      endDate: newEndDate,
      hasConflict,
    }));
  }

  /** Complete selection on mouseup */
  public onCellMouseUp(): void {
    const selection = this.dragSelection();
    if (!selection.isSelecting) return;

    if (!selection.hasConflict && selection.startDate && selection.endDate && selection.roomId) {
      // Normalize dates (start should be before end)
      const start = new Date(Math.min(selection.startDate.getTime(), selection.endDate.getTime()));
      const end = new Date(Math.max(selection.startDate.getTime(), selection.endDate.getTime()));
      
      // The end date IS the checkout date (last selected cell is checkout day)
      // But ensure minimum 1 night: if start == end (single cell clicked), checkout is next day
      let checkOutDate = new Date(end);
      if (start.getTime() === end.getTime()) {
        // Single cell selected - minimum 1 night, so checkout is next day
        checkOutDate.setDate(checkOutDate.getDate() + 1);
      }

      console.log('Check-in:', start, 'Check-out:', checkOutDate);
      // Open quick reservation modal with pre-filled data
      this.openQuickReservationWithDates(
        start, 
        checkOutDate, 
        selection.roomId, 
        selection.roomName,
        selection.roomTypeId,
        selection.roomTypeName
      );
    }

    // Reset selection
    this.resetDragSelection();
  }

  /** Reset drag selection state */
  public resetDragSelection(): void {
    this.dragSelection.set({
      isSelecting: false,
      startDate: null,
      endDate: null,
      roomId: null,
      roomName: null,
      roomTypeId: null,
      roomTypeName: null,
      hasConflict: false,
    });
  }

  /** Check if a cell is within the current selection */
  public isCellInSelection(date: DateRange, row: any): boolean {
    const selection = this.dragSelection();
    if (!selection.isSelecting || !selection.startDate || !selection.endDate) return false;
    if (row.isGroup || row.roomId !== selection.roomId) return false;

    const cellDate = new Date(date.date);
    cellDate.setHours(0, 0, 0, 0);
    
    const start = new Date(Math.min(selection.startDate.getTime(), selection.endDate.getTime()));
    let end = new Date(Math.max(selection.startDate.getTime(), selection.endDate.getTime()));
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // For single-cell selection, extend visual highlight to show minimum 1 night (2 cells: check-in + check-out)
    if (start.getTime() === end.getTime()) {
      end = new Date(end);
      end.setDate(end.getDate() + 1);
    }

    return cellDate >= start && cellDate <= end;
  }

  /** Open quick reservation modal with pre-filled dates from drag selection */
  private openQuickReservationWithDates(
    checkIn: Date, 
    checkOut: Date, 
    roomId: string, 
    roomName: string | null,
    roomTypeId: string | null,
    roomTypeName: string | null
  ): void {
    const dialogData: QuickReservationDialogData = {
      checkInDate: checkIn,
      checkOutDate: checkOut,
      preselectedRoomId: roomId,
      preselectedRoomName: roomName ?? undefined,
      preselectedRoomTypeId: roomTypeId ?? undefined,
      preselectedRoomTypeName: roomTypeName ?? undefined,
    };

    const dialogRef = this.dialog.open(QuickReservationModalComponent, {
      width: '600px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result) {
        this.router.navigate(['../create'], {
          relativeTo: this.route.parent,
          queryParams: { quickReservation: JSON.stringify(result) },
        });
      }
      }
    });
  }

  /** HostListener to cancel selection if mouse leaves the calendar area */
  @HostListener('document:mouseup')
  onDocumentMouseUp(): void {
    if (this.dragSelection().isSelecting) {
      this.onCellMouseUp();
    }
  }

}