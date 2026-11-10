import { useAppSelector } from '@/app/store'

/**
 * True when the signed-in admin holds `permission` (e.g. `staff:update`). Until `/auth/me` has
 * loaded, permissions are unknown and everything is shown; the API still enforces every check.
 */
export function usePermission(permission: string) {
  return useAppSelector((state) => {
    const permissions = state.auth.session?.user.permissions
    return !permissions || permissions.includes(permission)
  })
}

export function usePermissionCheck() {
  const permissions = useAppSelector((state) => state.auth.session?.user.permissions)
  return (permission: string) => !permissions || permissions.includes(permission)
}
