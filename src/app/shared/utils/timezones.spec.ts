import { allTimezones, deviceTimezone, filterTimezones, formatOffset, isKnownTimezone, offsetMinutes, timeIn, timezoneLabel } from './timezones';

describe('timezone helpers', () => {
  const winter = new Date('2026-01-15T12:00:00Z');
  const summer = new Date('2026-07-15T12:00:00Z');

  it('formats offsets', () => {
    expect(formatOffset(240)).toBe('+04:00');
    expect(formatOffset(-330)).toBe('-05:30');
    expect(formatOffset(0)).toBe('+00:00');
  });

  it('knows the offset of a zone at a given moment, including daylight saving', () => {
    expect(offsetMinutes('Indian/Mauritius', winter)).toBe(240);
    expect(offsetMinutes('Africa/Kigali', summer)).toBe(120);
    expect(offsetMinutes('Asia/Kolkata', summer)).toBe(330);
    expect(offsetMinutes('America/New_York', winter)).toBe(-300);
    expect(offsetMinutes('America/New_York', summer)).toBe(-240);
    expect(offsetMinutes('UTC+4')).toBe(240);
    expect(offsetMinutes('UTC-05:30')).toBe(-330);
    expect(offsetMinutes('UTC')).toBe(0);
  });

  it('validates', () => {
    expect(isKnownTimezone('Indian/Mauritius')).toBe(true);
    expect(isKnownTimezone('UTC+4')).toBe(true);
    expect(isKnownTimezone('Mauritius')).toBe(false);
    expect(isKnownTimezone('')).toBe(false);
  });

  it('lists many zones, sorted by offset, with today\'s offset on each', () => {
    const all = allTimezones(winter);
    expect(all.length).toBeGreaterThan(50);
    expect(all.map((o) => o.offsetMinutes)).toEqual([...all.map((o) => o.offsetMinutes)].sort((a, b) => a - b));
    expect(all.find((o) => o.value === 'Indian/Mauritius')).toMatchObject({ name: 'Indian/Mauritius', offset: 'UTC+04:00' });
  });

  it('finds a zone by city, country, region or offset, every word must match', () => {
    const all = allTimezones(winter);
    const values = (q: string) => filterTimezones(all, q).map((o) => o.value);
    expect(values('mauritius')).toContain('Indian/Mauritius');
    expect(values('rwanda')).toContain('Africa/Kigali');
    expect(values('kigali')).toEqual(['Africa/Kigali']);
    expect(values('new york')).toContain('America/New_York');
    expect(values('+04:00')).toContain('Indian/Mauritius');
    expect(values('africa nairobi')).toContain('Africa/Nairobi');
    expect(values('zzzz-nothing')).toEqual([]);
    expect(filterTimezones(all, '', 5)).toHaveLength(5);
  });

  it('writes a saved value the way it reads on screen', () => {
    expect(timezoneLabel('Indian/Mauritius', winter)).toBe('Indian/Mauritius (UTC+04:00)');
    expect(timezoneLabel('America/Argentina/Buenos_Aires', winter)).toBe('America/Argentina/Buenos Aires (UTC-03:00)');
    expect(timezoneLabel('UTC+4')).toBe('UTC+04:00 (fixed offset)');
    expect(timezoneLabel('')).toBe('');
  });

  it('tells the time there', () => {
    expect(timeIn('Indian/Mauritius', winter)).toBe('16:00');
    expect(timeIn('UTC+4', winter)).toBe('16:00');
    expect(timeIn('Asia/Kolkata', winter)).toBe('17:30');
    expect(typeof deviceTimezone()).toBe('string');
  });
});
