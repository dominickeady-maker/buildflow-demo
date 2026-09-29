const UK_LOCALE = 'en-GB';

export function formatDateUK(date: string | Date): string {
  return new Date(date).toLocaleDateString(UK_LOCALE);
}

export function formatDateTimeUK(date: string | Date): string {
  return new Date(date).toLocaleString(UK_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeUK(date: string | Date): string {
  return new Date(date).toLocaleTimeString(UK_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
