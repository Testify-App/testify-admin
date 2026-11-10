import { useAppSelector } from '@/app/store'
import { useGetRolesQuery } from './access-api'
import type { Role, StaffMember } from './model'

const noRoles: Role[] = []

/** Every role, with how many staff hold each one. */
export function useRoles() {
  const query = useGetRolesQuery()
  return { ...query, roles: query.data ?? noRoles }
}

/** True when `staff` is the signed-in admin (they can't suspend themselves or change their role). */
export function useIsOwnAccount(staff?: Pick<StaffMember, 'id' | 'email'>) {
  const user = useAppSelector((state) => state.auth.session?.user)
  return (
    !!staff &&
    !!user &&
    (staff.id === user.id || staff.email.toLowerCase() === user.email.toLowerCase())
  )
}
