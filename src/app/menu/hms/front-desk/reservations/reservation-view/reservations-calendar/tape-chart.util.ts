/**
 * Pure logic behind the reservation tape chart: where a stay's bar sits on the grid, how busy each night is,
 * and which stays need a front-desk eye today. No Angular, no DOM, so every rule here is unit-tested.
 */

export type StayStatus = 'pending' | 'confirmed' | 'reserved' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export const MS_PER_DAY = 86_400_000;

/** A calendar day (local time, no clock). Handles plain dates, ISO strings and Date objects alike. */
export function parseDay(input: string | Date | number): Date {
  if (input instanceof Date) return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  const text = String(input);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [y, m, d] = text.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  // An ISO instant (e.g. 23:00Z) belongs to the day it falls on in the viewer's own timezone.
  const parsed = new Date(text);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Whole days from `from` to `to` (DST-safe: both are local midnights). */
export function daysBetween(from: Date, to: Date): number {
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((utcTo - utcFrom) / MS_PER_DAY);
}

export interface BarLayout {
  /** Where the bar starts, in day-columns from the left edge of the window (check-in sits mid-column). */
  left: number;
  /** How wide it is, in day-columns. */
  width: number;
  /** The stay began before the window: draw a flat, open left edge. */
  startsBefore: boolean;
  /** The stay carries on past the window: draw a flat, open right edge. */
  endsAfter: boolean;
  nights: number;
}

/**
 * A stay is drawn from the MIDDLE of its check-in day to the MIDDLE of its check-out day. That is how a hotel
 * actually turns a room over (one guest leaves in the morning, the next arrives in the afternoon), and it means
 * two stays that share a changeover day sit side by side instead of stacking on top of each other.
 * Returns null when the stay does not touch the window at all.
 */
export function layoutBar(checkIn: string | Date, checkOut: string | Date, windowStart: Date, days: number): BarLayout | null {
  const start = parseDay(checkIn);
  let end = parseDay(checkOut);
  if (end.getTime() <= start.getTime()) end = addDays(start, 1); // a stay is at least one night

  const startIndex = daysBetween(windowStart, start);
  const endIndex = daysBetween(windowStart, end);
  const nights = daysBetween(start, end);

  const rawLeft = startIndex + 0.5;
  const rawRight = endIndex + 0.5;
  if (rawRight <= 0 || rawLeft >= days) return null;

  const left = Math.max(rawLeft, 0);
  const right = Math.min(rawRight, days);
  return { left, width: right - left, startsBefore: rawLeft < 0, endsAfter: rawRight > days, nights };
}

export interface StayDates {
  checkIn: string | Date;
  checkOut: string | Date;
}

/** Does a stay occupy the room on the night that begins on `night`? (checkIn <= night < checkOut) */
export function occupiesNight(stay: StayDates, night: Date): boolean {
  const start = parseDay(stay.checkIn);
  let end = parseDay(stay.checkOut);
  if (end.getTime() <= start.getTime()) end = addDays(start, 1);
  const t = night.getTime();
  return t >= start.getTime() && t < end.getTime();
}

/** Would booking `nights` nights from `checkIn` collide with any of these stays? */
export function overlapsAny(stays: StayDates[], checkIn: Date, checkOut: Date): boolean {
  return stays.some((s) => {
    const start = parseDay(s.checkIn);
    let end = parseDay(s.checkOut);
    if (end.getTime() <= start.getTime()) end = addDays(start, 1);
    return start.getTime() < checkOut.getTime() && end.getTime() > checkIn.getTime();
  });
}

export interface NightOccupancy {
  /** Rooms in use that night. */
  occupied: number;
  /** Rooms that could be sold that night. */
  sellable: number;
  /** 0-100, or null when there is nothing to sell. */
  percent: number | null;
}

/** How full the house is on each night of the window. */
export function occupancyPerNight(stays: StayDates[], windowStart: Date, days: number, sellableRooms: number): NightOccupancy[] {
  const counts = new Array<number>(days).fill(0);
  for (const stay of stays) {
    const start = parseDay(stay.checkIn);
    let end = parseDay(stay.checkOut);
    if (end.getTime() <= start.getTime()) end = addDays(start, 1);
    const first = Math.max(0, daysBetween(windowStart, start));
    const lastExclusive = Math.min(days, daysBetween(windowStart, end));
    for (let i = first; i < lastExclusive; i++) counts[i]++;
  }
  return counts.map((occupied) => ({
    occupied,
    sellable: sellableRooms,
    percent: sellableRooms > 0 ? Math.min(100, Math.round((occupied / sellableRooms) * 100)) : null,
  }));
}

export type Urgency = 'arriving' | 'departing' | 'overdue' | 'late' | null;

/**
 * What the front desk should look at: a guest due in today who has not been checked in, one due out today who has
 * not left, a guest still in the room after their check-out day, or a booking whose arrival day has passed without
 * a check-in. Everything else is just a stay.
 */
export function urgencyOf(status: string, checkIn: string | Date, checkOut: string | Date, today: Date): Urgency {
  const start = parseDay(checkIn);
  const end = parseDay(checkOut);
  const t = parseDay(today).getTime();
  const waiting = status === 'pending' || status === 'confirmed' || status === 'reserved';
  if (waiting && start.getTime() === t) return 'arriving';
  if (waiting && start.getTime() < t) return 'late';
  if (status === 'checked_in' && end.getTime() === t) return 'departing';
  if (status === 'checked_in' && end.getTime() < t) return 'overdue';
  return null;
}

/** Colour-coded palette for stays. Hex values are chosen so white text stays readable on every one. */
export const STAY_COLORS: Record<StayStatus, string> = {
  pending: '#b45309',
  confirmed: '#1d4ed8',
  reserved: '#4f46e5',
  checked_in: '#15803d',
  checked_out: '#64748b',
  cancelled: '#b91c1c',
  no_show: '#c2410c',
};

export const STAY_ICONS: Record<StayStatus, string> = {
  pending: 'hourglass_top',
  confirmed: 'event_available',
  reserved: 'bookmark',
  checked_in: 'login',
  checked_out: 'logout',
  cancelled: 'event_busy',
  no_show: 'person_off',
};
