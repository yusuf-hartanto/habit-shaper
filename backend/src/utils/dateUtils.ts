/**
 * Calendar-date helpers built on UTC `YYYY-MM-DD` strings.
 *
 * All streak / weekly calculations operate on these strings (never on local-time
 * Date objects), so results are deterministic regardless of host timezone.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Parses `YYYY-MM-DD` as UTC midnight (epoch ms). */
const toUtcMs = (dateStr: string): number => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/** True if `value` is a real calendar date in `YYYY-MM-DD` form (e.g. rejects 2026-02-30). */
export const isValidDateString = (value: unknown): value is string => {
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) return false;
  return toDateString(new Date(toUtcMs(value))) === value;
};

/** Formats a Date as its UTC `YYYY-MM-DD` calendar date. */
export const toDateString = (date: Date): string => date.toISOString().slice(0, 10);

/** Today's UTC calendar date. `now` is injectable for deterministic tests. */
export const getTodayDateString = (now: Date = new Date()): string => toDateString(now);

/** `dateStr` shifted back by `days` (negative values shift forward). */
export const subtractDays = (dateStr: string, days: number): string =>
  toDateString(new Date(toUtcMs(dateStr) - days * MS_PER_DAY));

/** `dateStr` shifted forward by `days`. */
export const addDays = (dateStr: string, days: number): string => subtractDays(dateStr, -days);

/** Whole days from `startDate` to `endDate` (positive if end is later). */
export const daysBetween = (startDate: string, endDate: string): number =>
  Math.round((toUtcMs(endDate) - toUtcMs(startDate)) / MS_PER_DAY);

/**
 * The last `n` calendar days ending at `endDate` (inclusive), oldest first.
 * e.g. getPastNDaysStrings(7) -> [today-6, ..., today]
 */
export const getPastNDaysStrings = (n: number, endDate: string = getTodayDateString()): string[] =>
  Array.from({ length: n }, (_, i) => subtractDays(endDate, n - 1 - i));
