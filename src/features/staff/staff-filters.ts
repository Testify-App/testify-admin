import type { StaffStatus } from '@/features/roles/model'

export interface StaffFilterValue {
  from: string
  to: string
  status: StaffStatus | ''
  roleId: string
}
export const emptyStaffFilters: StaffFilterValue = { from: '', to: '', status: '', roleId: '' }

/** Number of active filter groups (a date range counts once). */
export function staffFilterCount(filters: StaffFilterValue) {
  return (
    Number(!!filters.from || !!filters.to) + Number(!!filters.status) + Number(!!filters.roleId)
  )
}
