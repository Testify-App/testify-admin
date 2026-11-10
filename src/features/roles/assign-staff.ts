import { errorMessage } from '@/lib/api/base-api'
import type { useReassignRoleMutation } from './access-api'

/** Moves each staff member into `roleId`, one request each; returns how many failed. */
export async function assignStaff(
  reassign: ReturnType<typeof useReassignRoleMutation>[0],
  staffIds: string[],
  roleId: string,
) {
  const results = await Promise.allSettled(
    staffIds.map((staffId) => reassign({ staffId, roleId }).unwrap()),
  )
  const failed = results.filter((result) => result.status === 'rejected')
  return {
    failed: failed.length,
    reason: failed.length ? errorMessage((failed[0] as PromiseRejectedResult).reason) : '',
  }
}
