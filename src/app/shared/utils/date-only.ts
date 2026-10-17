/**
 * A calendar day as YYYY-MM-DD in the user's own timezone. Reports are asked for whole days, so the date must reach
 * the server exactly as chosen: sending an ISO instant (23:00Z for a midnight in UTC+1) would move it a day.
 */
export function toDateOnly(value: Date | string): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = value instanceof Date ? value : new Date(value);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}
