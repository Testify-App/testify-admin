/** e.g. “Nov 8, 2026”. */
export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

/** e.g. “Nov 8, 2026, 4:40 PM”. */
export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )
}

/** e.g. “5 mins ago”, “3 days ago”, falling back to the date after a month. */
export function timeAgo(value: string | null | undefined, now = Date.now()) {
  if (!value) return '—'
  const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000))
  const units: [number, string][] = [
    [60 * 60 * 24 * 7, 'week'],
    [60 * 60 * 24, 'day'],
    [60 * 60, 'hour'],
    [60, 'min'],
  ]
  if (seconds < 60) return 'Just now'
  if (seconds >= 60 * 60 * 24 * 30) return formatDate(value)
  for (const [size, unit] of units) {
    if (seconds >= size) {
      const count = Math.floor(seconds / size)
      return `${count} ${unit}${count === 1 ? '' : 's'} ago`
    }
  }
  return formatDate(value)
}

/** `YYYY-MM-DD` for `days` ago (0 = today), in local time. */
export function daysAgo(days: number, now = new Date()) {
  const date = new Date(now)
  date.setDate(date.getDate() - days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
