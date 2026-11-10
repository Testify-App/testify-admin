import { useEffect, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/store'
import { profileLoaded } from '@/app/session-slice'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Panel } from '@/components/testify/panel'
import { useGetProfileQuery } from './auth-api'
import { usePermission } from './use-permission'

/**
 * Sends signed-out visitors to the sign-in page, remembering where they were going, and keeps
 * the signed-in admin's role and permissions in step with the server.
 */
export function RequireAuth() {
  const dispatch = useAppDispatch()
  const token = useAppSelector((state) => state.auth.session?.token)
  const location = useLocation()
  const { data: profile } = useGetProfileQuery(undefined, {
    skip: !token,
    refetchOnFocus: true,
  })
  useEffect(() => {
    if (profile) dispatch(profileLoaded(profile))
  }, [dispatch, profile])

  if (!token) return <Navigate to="/sign-in" replace state={{ from: location }} />
  return <Outlet />
}

/** Renders `children` only when the admin holds `permission`. */
export function RequirePermission({
  permission,
  title,
  children,
}: {
  permission: string
  title: string
  children: ReactNode
}) {
  if (usePermission(permission)) return children
  return (
    <AdminLayout title={title}>
      <Panel className="flex flex-col items-center gap-3 px-6 py-[70px] text-center">
        <ShieldAlert className="size-12 text-tf-dim" aria-hidden />
        <h2 className="text-[20px] font-semibold">You don’t have access to this page</h2>
        <p className="max-w-[420px] text-[14px] text-tf-muted">
          Ask an administrator to add this permission to your role.
        </p>
      </Panel>
    </AdminLayout>
  )
}
