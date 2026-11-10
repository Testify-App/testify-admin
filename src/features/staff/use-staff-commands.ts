import { useCallback } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/api/base-api'
import { useReactivateStaffMutation, useResendInviteMutation } from '@/features/roles/access-api'
import { staffName, type StaffMember } from '@/features/roles/model'

/** One-step staff actions that need no form: reactivate and resend invite. */
export function useStaffCommands() {
  const [reactivateRequest] = useReactivateStaffMutation()
  const [resendRequest] = useResendInviteMutation()
  const reactivate = useCallback(
    async (staff: StaffMember) => {
      try {
        await reactivateRequest(staff.id).unwrap()
        toast.success(`${staffName(staff)} has been reactivated`)
      } catch (cause) {
        toast.error(errorMessage(cause))
      }
    },
    [reactivateRequest],
  )
  const resendInvite = useCallback(
    async (staff: StaffMember) => {
      try {
        await resendRequest(staff.id).unwrap()
        toast.success(`A new invitation has been sent to ${staff.email}`)
      } catch (cause) {
        toast.error(errorMessage(cause))
      }
    },
    [resendRequest],
  )
  return { reactivate, resendInvite }
}
