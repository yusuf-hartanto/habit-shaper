/** Display helpers for backend UTC `YYYY-MM-DD` calendar dates. */

const toUtcDate = (dateStr: string): Date => new Date(`${dateStr}T00:00:00Z`);

/** "Oct 16, 2026" */
export const formatDate = (dateStr: string): string =>
  toUtcDate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

/** "Fri, Oct 16" */
export const formatDayLabel = (dateStr: string): string =>
  toUtcDate(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

/** "Fr" — two-letter weekday, unambiguous (Tu/Th, Sa/Su). */
export const weekdayShort = (dateStr: string): string =>
  toUtcDate(dateStr).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).slice(0, 2);

export const pluralize = (count: number, word: string, plural = `${word}s`): string =>
  `${count} ${count === 1 ? word : plural}`;

export const greeting = (now: Date = new Date()): string => {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};
