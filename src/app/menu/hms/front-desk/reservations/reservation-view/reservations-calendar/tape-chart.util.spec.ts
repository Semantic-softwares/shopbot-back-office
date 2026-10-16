import {
  addDays, dayKey, daysBetween, layoutBar, occupancyPerNight, occupiesNight, overlapsAny, parseDay, urgencyOf,
} from './tape-chart.util';

const w = new Date(2026, 9, 10); // Sat 10 Oct 2026, a 14-day window

describe('tape chart layout', () => {
  it('reads plain dates, ISO instants and Date objects as the same local day', () => {
    expect(dayKey(parseDay('2026-10-12'))).toBe('2026-10-12');
    expect(dayKey(parseDay(new Date(2026, 9, 12, 23, 59)))).toBe('2026-10-12');
    expect(dayKey(parseDay(new Date(2026, 9, 12, 14, 0).toISOString()))).toBe('2026-10-12');
  });

  it('counts whole days across a daylight-saving change', () => {
    expect(daysBetween(new Date(2026, 2, 28), new Date(2026, 2, 30))).toBe(2);
    expect(daysBetween(new Date(2026, 9, 24), new Date(2026, 9, 26))).toBe(2);
    expect(dayKey(addDays(new Date(2026, 9, 31), 1))).toBe('2026-11-01');
  });

  it('draws a stay from the middle of check-in day to the middle of check-out day', () => {
    // 12 Oct -> 15 Oct: 3 nights, starts mid-day-2 (index 2), ends mid-day-5
    expect(layoutBar('2026-10-12', '2026-10-15', w, 14)).toEqual({ left: 2.5, width: 3, startsBefore: false, endsAfter: false, nights: 3 });
  });

  it('puts a check-out and the next check-in on the same day side by side, never overlapping', () => {
    const a = layoutBar('2026-10-12', '2026-10-14', w, 14)!;
    const b = layoutBar('2026-10-14', '2026-10-16', w, 14)!;
    expect(a.left + a.width).toBe(b.left); // they meet exactly at the middle of the changeover day
  });

  it('treats a zero or negative length stay as one night', () => {
    expect(layoutBar('2026-10-12', '2026-10-12', w, 14)!.nights).toBe(1);
    expect(layoutBar('2026-10-12', '2026-10-11', w, 14)!.width).toBe(1);
  });

  it('opens the left edge of a stay that began before the window, and the right edge of one that goes past it', () => {
    expect(layoutBar('2026-10-05', '2026-10-12', w, 14)).toEqual({ left: 0, width: 2.5, startsBefore: true, endsAfter: false, nights: 7 });
    expect(layoutBar('2026-10-22', '2026-10-30', w, 14)).toEqual({ left: 12.5, width: 1.5, startsBefore: false, endsAfter: true, nights: 8 });
  });

  it('skips stays that do not touch the window', () => {
    expect(layoutBar('2026-10-01', '2026-10-09', w, 14)).toBeNull();
    expect(layoutBar('2026-10-24', '2026-10-26', w, 14)).toBeNull();
  });

  it('keeps a stay that checks out in the middle of the first column', () => {
    // leaves on the 10th (window start): the bar is the left half of column 0
    expect(layoutBar('2026-10-08', '2026-10-10', w, 14)).toEqual({ left: 0, width: 0.5, startsBefore: true, endsAfter: false, nights: 2 });
  });
});

describe('tape chart occupancy and conflicts', () => {
  const stay = (a: string, b: string) => ({ checkIn: a, checkOut: b });

  it('a night belongs to the stay from check-in up to, not including, check-out', () => {
    const s = stay('2026-10-12', '2026-10-14');
    expect(occupiesNight(s, new Date(2026, 9, 11))).toBe(false);
    expect(occupiesNight(s, new Date(2026, 9, 12))).toBe(true);
    expect(occupiesNight(s, new Date(2026, 9, 13))).toBe(true);
    expect(occupiesNight(s, new Date(2026, 9, 14))).toBe(false);
  });

  it('a new booking may start on a check-out day but not before it', () => {
    const stays = [stay('2026-10-12', '2026-10-14')];
    expect(overlapsAny(stays, new Date(2026, 9, 14), new Date(2026, 9, 16))).toBe(false);
    expect(overlapsAny(stays, new Date(2026, 9, 13), new Date(2026, 9, 15))).toBe(true);
    expect(overlapsAny(stays, new Date(2026, 9, 10), new Date(2026, 9, 12))).toBe(false);
    expect(overlapsAny(stays, new Date(2026, 9, 10), new Date(2026, 9, 13))).toBe(true);
  });

  it('counts how many rooms are in use each night, against what can be sold', () => {
    const occ = occupancyPerNight([stay('2026-10-10', '2026-10-12'), stay('2026-10-11', '2026-10-13'), stay('2026-10-01', '2026-10-11')], w, 4, 4);
    expect(occ.map((o) => o.occupied)).toEqual([2, 2, 1, 0]);
    expect(occ.map((o) => o.percent)).toEqual([50, 50, 25, 0]);
  });

  it('reports no percentage when there is nothing to sell, and never goes above 100', () => {
    expect(occupancyPerNight([stay('2026-10-10', '2026-10-11')], w, 1, 0)[0].percent).toBeNull();
    expect(occupancyPerNight([stay('2026-10-10', '2026-10-11'), stay('2026-10-10', '2026-10-11')], w, 1, 1)[0].percent).toBe(100);
  });

  it('ignores stays outside the window and counts a window-spanning stay on every night', () => {
    expect(occupancyPerNight([stay('2026-09-01', '2026-09-05')], w, 3, 2).map((o) => o.occupied)).toEqual([0, 0, 0]);
    expect(occupancyPerNight([stay('2026-09-01', '2026-12-05')], w, 3, 2).map((o) => o.occupied)).toEqual([1, 1, 1]);
  });
});

describe('what needs the front desk today', () => {
  const today = new Date(2026, 9, 14);
  it('flags arrivals and departures due today', () => {
    expect(urgencyOf('confirmed', '2026-10-14', '2026-10-16', today)).toBe('arriving');
    expect(urgencyOf('pending', '2026-10-14', '2026-10-16', today)).toBe('arriving');
    expect(urgencyOf('checked_in', '2026-10-12', '2026-10-14', today)).toBe('departing');
  });
  it('flags a guest still in after check-out day, and an arrival that never showed up', () => {
    expect(urgencyOf('checked_in', '2026-10-10', '2026-10-13', today)).toBe('overdue');
    expect(urgencyOf('confirmed', '2026-10-12', '2026-10-15', today)).toBe('late');
  });
  it('leaves everything else alone', () => {
    expect(urgencyOf('checked_in', '2026-10-12', '2026-10-16', today)).toBeNull();
    expect(urgencyOf('confirmed', '2026-10-15', '2026-10-17', today)).toBeNull();
    expect(urgencyOf('checked_out', '2026-10-10', '2026-10-13', today)).toBeNull();
    expect(urgencyOf('cancelled', '2026-10-14', '2026-10-16', today)).toBeNull();
  });
});
