/**
 * Date utility for Jakarta timezone (UTC+7)
 */

export const JAKARTA_TIMEZONE = 'Asia/Jakarta';
export const JAKARTA_OFFSET_HOURS = 7;

/**
 * Get current time in Jakarta timezone
 */
export function getJakartaNow(): Date {
  const now = new Date();
  const jakartaTime = new Date(
    now.toLocaleString('en-US', { timeZone: JAKARTA_TIMEZONE }),
  );
  return jakartaTime;
}

/**
 * Format date to Jakarta timezone string
 */
export function formatDateJakarta(
  date: Date | string | null | undefined,
  format: 'short' | 'long' | 'full' = 'short',
): string {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: JAKARTA_TIMEZONE,
  };

  switch (format) {
    case 'short':
      options.month = 'short';
      options.day = 'numeric';
      options.year = 'numeric';
      break;
    case 'long':
      options.month = 'long';
      options.day = 'numeric';
      options.year = 'numeric';
      break;
    case 'full':
      options.weekday = 'long';
      options.month = 'long';
      options.day = 'numeric';
      options.year = 'numeric';
      break;
  }

  return d.toLocaleDateString('en-US', options);
}

/**
 * Format time to Jakarta timezone string
 */
export function formatTimeJakarta(
  date: Date | string | null | undefined,
  use24Hour: boolean = true,
): string {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: JAKARTA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
  };

  return d.toLocaleTimeString('en-US', options);
}

/**
 * Format date and time to Jakarta timezone string
 */
export function formatDateTimeJakarta(
  date: Date | string | null | undefined,
): string {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: JAKARTA_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  return d.toLocaleString('en-US', options);
}

/**
 * Convert UTC date to Jakarta Date object
 */
export function toJakartaDate(utcDate: Date | string): Date {
  const d = new Date(utcDate);
  return new Date(d.toLocaleString('en-US', { timeZone: JAKARTA_TIMEZONE }));
}

/**
 * Get start of day in Jakarta timezone
 */
export function getStartOfDayJakarta(date?: Date | string): Date {
  const d = date ? new Date(date) : new Date();
  const jakartaDate = new Date(
    d.toLocaleString('en-US', { timeZone: JAKARTA_TIMEZONE }),
  );
  jakartaDate.setHours(0, 0, 0, 0);
  return jakartaDate;
}

/**
 * Get end of day in Jakarta timezone
 */
export function getEndOfDayJakarta(date?: Date | string): Date {
  const d = date ? new Date(date) : new Date();
  const jakartaDate = new Date(
    d.toLocaleString('en-US', { timeZone: JAKARTA_TIMEZONE }),
  );
  jakartaDate.setHours(23, 59, 59, 999);
  return jakartaDate;
}
