/**
 * Timezone helpers for the timezone selector. A timezone is an IANA name ("Indian/Mauritius", which follows daylight
 * saving) or, for hotels set up before the selector existed, a fixed offset such as "UTC+4".
 */

export interface TimezoneOption {
  /** What is saved: the IANA name. */
  value: string;
  /** "Indian/Mauritius" with underscores as spaces, as people read it. */
  name: string;
  /** "UTC+04:00", right now (so it is correct in summer and winter). */
  offset: string;
  offsetMinutes: number;
  /** Lower-case text the search box matches against: name, region, offset and common aliases. */
  search: string;
}

/** Used only when the browser cannot list zones itself (older Safari). */
const FALLBACK = [
  'UTC', 'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers', 'Africa/Blantyre', 'Africa/Cairo', 'Africa/Casablanca', 'Africa/Dar_es_Salaam', 'Africa/Dakar',
  'Africa/Gaborone', 'Africa/Harare', 'Africa/Johannesburg', 'Africa/Kampala', 'Africa/Kigali', 'Africa/Lagos', 'Africa/Lusaka', 'Africa/Maputo', 'Africa/Nairobi', 'Africa/Windhoek',
  'America/Argentina/Buenos_Aires', 'America/Bogota', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Mexico_City', 'America/New_York', 'America/Sao_Paulo', 'America/Toronto',
  'Asia/Bangkok', 'Asia/Dhaka', 'Asia/Dubai', 'Asia/Hong_Kong', 'Asia/Jakarta', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Manila', 'Asia/Riyadh', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Tokyo',
  'Atlantic/Azores', 'Australia/Perth', 'Australia/Sydney', 'Europe/Amsterdam', 'Europe/Berlin', 'Europe/Dublin', 'Europe/Istanbul', 'Europe/London', 'Europe/Madrid', 'Europe/Moscow', 'Europe/Paris', 'Europe/Rome',
  'Indian/Antananarivo', 'Indian/Mahe', 'Indian/Mauritius', 'Indian/Reunion', 'Pacific/Auckland', 'Pacific/Honolulu',
];

/** City or region names people type that the IANA name does not contain. */
const ALIASES: Record<string, string> = {
  'Africa/Kigali': 'rwanda', 'Indian/Mauritius': 'mauritius port louis', 'Africa/Nairobi': 'kenya', 'Africa/Kampala': 'uganda', 'Africa/Dar_es_Salaam': 'tanzania',
  'Africa/Lagos': 'nigeria', 'Africa/Accra': 'ghana', 'Africa/Johannesburg': 'south africa', 'Europe/London': 'united kingdom uk england', 'America/New_York': 'eastern new york usa',
  'America/Chicago': 'central chicago usa', 'America/Denver': 'mountain usa', 'America/Los_Angeles': 'pacific los angeles usa', 'Asia/Kolkata': 'india mumbai delhi', 'Asia/Dubai': 'uae emirates',
  'Indian/Mahe': 'seychelles', 'Indian/Antananarivo': 'madagascar', 'Africa/Maputo': 'mozambique', 'Africa/Lusaka': 'zambia', 'Africa/Harare': 'zimbabwe', 'Africa/Cairo': 'egypt',
};

const FIXED = /^UTC(?:\s*([+-])(\d{1,2})(?::?(\d{2}))?)?$/i;

/** "+04:00" for 240 minutes, "-05:30" for -330. */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

/** Minutes a zone is ahead of UTC at a given moment. Fixed offsets are read directly; unknown zones give 0. */
export function offsetMinutes(tz: string, at: Date = new Date()): number {
  const fixed = FIXED.exec(tz.trim());
  if (fixed) return fixed[1] ? (Number(fixed[2]) * 60 + Number(fixed[3] ?? 0)) * (fixed[1] === '-' ? -1 : 1) : 0;
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
        .formatToParts(at)
        .map((p) => [p.type, p.value]),
    ) as Record<string, string>;
    const asUtc = Date.UTC(+parts['year'], +parts['month'] - 1, +parts['day'], +parts['hour'], +parts['minute'], +parts['second']);
    return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);
  } catch {
    return 0;
  }
}

/** True for a name the browser knows, or a fixed offset in range. */
export function isKnownTimezone(tz: string): boolean {
  if (!tz) return false;
  const fixed = FIXED.exec(tz.trim());
  if (fixed) return !fixed[1] || Math.abs(offsetMinutes(tz)) <= 14 * 60;
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return tz.includes('/') || tz === 'UTC';
  } catch {
    return false;
  }
}

/** The timezone of the device the page is open on, or '' if the browser will not say. */
export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    return '';
  }
}

function listNames(): string[] {
  const fn = (Intl as any).supportedValuesOf;
  if (typeof fn === 'function') {
    try {
      const names: string[] = fn.call(Intl, 'timeZone');
      return names.includes('UTC') ? names : ['UTC', ...names];
    } catch {
      /* fall through to the short list */
    }
  }
  return FALLBACK;
}

function toOption(value: string, at: Date): TimezoneOption {
  const minutes = offsetMinutes(value, at);
  const name = value.replace(/_/g, ' ');
  const offset = `UTC${formatOffset(minutes)}`;
  return { value, name, offset, offsetMinutes: minutes, search: `${value} ${name} ${offset} ${formatOffset(minutes)} ${ALIASES[value] ?? ''}`.toLowerCase() };
}

/** Every zone, ordered by offset then name, with the offset as it is today. */
export function allTimezones(at: Date = new Date()): TimezoneOption[] {
  return listNames().map((n) => toOption(n, at)).sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.name.localeCompare(b.name));
}

/** The zones matching what was typed (every word must appear), the first `limit` of them. */
export function filterTimezones(options: TimezoneOption[], query: string, limit = 60): TimezoneOption[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return options.slice(0, limit);
  return options.filter((o) => words.every((w) => o.search.includes(w))).slice(0, limit);
}

/** How a saved value reads on screen: "Indian/Mauritius (UTC+04:00)". Works for a legacy "UTC+4" too. */
export function timezoneLabel(value: string, at: Date = new Date()): string {
  if (!value) return '';
  const o = toOption(value, at);
  return FIXED.test(value.trim()) ? `${o.offset} (fixed offset)` : `${o.name} (${o.offset})`;
}

/** The time of day in a zone, "14:32". */
export function timeIn(tz: string, at: Date = new Date()): string {
  try {
    const fixed = FIXED.exec(tz.trim());
    if (fixed) {
      const shifted = new Date(at.getTime() + offsetMinutes(tz, at) * 60000);
      return `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`;
    }
    return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
  } catch {
    return '';
  }
}
