import type { ReportItem } from './moderation-api'

/** Short reference shown in tables (full IDs are UUIDs). */
export const shortId = (id: string) => id.slice(0, 8).toUpperCase()

/** One-line description of what was reported. */
export function reportSummary(row: ReportItem) {
  if (row.entityType === 'user') return `Account @${row.owner.username ?? 'unknown'}`
  return row.content.text?.trim() || (row.content.media.length ? 'Media only' : '—')
}
