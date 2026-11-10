import { inDateRange, type StaffStatus } from './model'

export type AccessStatus = StaffStatus

export interface StatusFilterValue {
  from: string
  to: string
  statuses: readonly AccessStatus[]
}
export const emptyStatusFilters: StatusFilterValue = { from: '', to: '', statuses: [] }

export function matchesStatusFilters(
  item: { createdAt: string; status: AccessStatus },
  filters: StatusFilterValue,
) {
  return (
    inDateRange(item.createdAt, filters.from, filters.to) &&
    (!filters.statuses.length || filters.statuses.includes(item.status))
  )
}

/** Number of active filter groups (a date range counts once). */
export function statusFilterCount(filters: StatusFilterValue) {
  return Number(!!filters.from || !!filters.to) + filters.statuses.length
}
