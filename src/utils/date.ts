export interface FormatDateOptions {
  fallback?: string;
  timeZone?: string;
}

const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateTimeFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone,
    });
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

/**
 * Formats a date, string, or timestamp into 'dd/MM/yyyy' format (Vietnamese standard).
 *
 * @param value - Date object, ISO string, timestamp, or null/undefined
 * @param fallbackOrOptions - Optional fallback string or FormatDateOptions object
 * @returns Formatted date string in 'dd/MM/yyyy' format, or fallback if invalid
 */
export function formatDate(
  value: Date | string | number | null | undefined,
  fallbackOrOptions: string | FormatDateOptions = '',
): string {
  const options: FormatDateOptions =
    typeof fallbackOrOptions === 'string'
      ? { fallback: fallbackOrOptions }
      : fallbackOrOptions;

  const fallback = options.fallback ?? '';
  const timeZone = options.timeZone ?? DEFAULT_TIMEZONE;

  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return fallback;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  try {
    return getDateTimeFormatter(timeZone).format(date);
  } catch {
    return fallback;
  }
}
