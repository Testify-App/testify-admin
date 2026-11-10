import { lazy, Suspense, type ComponentType } from 'react'
import { Route, Routes } from 'react-router-dom'
import { NotFoundPage } from '@/pages/not-found-page'
import { RequireAuth, RequirePermission } from '@/features/auth/require-auth'
import { SignInPage } from '@/features/auth/sign-in-page'
import { VerifySignInPage } from '@/features/auth/verify-sign-in-page'
import { ForgotPasswordPage } from '@/features/auth/forgot-password-page'
import { AcceptInvitePage } from '@/features/auth/accept-invite-page'

const named = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((module) => ({ default: module[name] })))

const OverviewPage = named(() => import('@/features/overview/overview-page'), 'OverviewPage')
const ModerationQueuePage = named(
  () => import('@/features/moderation/moderation-queue-page'),
  'ModerationQueuePage',
)
const ReportDetailPage = named(
  () => import('@/features/moderation/report-detail-page'),
  'ReportDetailPage',
)
const ReporterProfilePage = named(
  () => import('@/features/moderation/reporter-profile-page'),
  'ReporterProfilePage',
)
const ContentOwnerProfilePage = named(
  () => import('@/features/moderation/content-owner-profile-page'),
  'ContentOwnerProfilePage',
)
const MemberProfilePage = named(
  () => import('@/features/moderation/content-owner-profile-page'),
  'MemberProfilePage',
)
const ReportsPage = named(() => import('@/features/reports/reports-page'), 'ReportsPage')
const UsersPage = named(() => import('@/features/users/users-page'), 'UsersPage')
const AuditLogPage = named(() => import('@/features/audit-log/audit-log-page'), 'AuditLogPage')
const HiddenContentPage = named(
  () => import('@/features/hidden-content/hidden-content-page'),
  'HiddenContentPage',
)
const RolesPage = named(() => import('@/features/roles/roles-page'), 'RolesPage')
const RoleDetailPage = named(() => import('@/features/roles/role-detail-page'), 'RoleDetailPage')
const StaffPage = named(() => import('@/features/staff/staff-page'), 'StaffPage')
const StaffDetailPage = named(() => import('@/features/staff/staff-detail-page'), 'StaffDetailPage')
const SettingsPage = named(() => import('@/features/settings/settings-page'), 'SettingsPage')

export function LoadingScreen() {
  return (
    <main className="grid min-h-dvh place-items-center bg-tf-page font-dm-sans">
      <p role="status" className="text-sm text-tf-muted">
        Loading your workspace…
      </p>
    </main>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-in/verify" element={<VerifySignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/moderation" element={<ModerationQueuePage />} />
          <Route path="/moderation/:reportId" element={<ReportDetailPage />} />
          <Route path="/moderation/:reportId/reporter" element={<ReporterProfilePage />} />
          <Route path="/moderation/:reportId/owner" element={<ContentOwnerProfilePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:userId" element={<MemberProfilePage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/hidden-content" element={<HiddenContentPage />} />
          <Route
            path="/roles"
            element={
              <RequirePermission permission="roles:view" title="Roles & Permissions">
                <RolesPage />
              </RequirePermission>
            }
          />
          <Route
            path="/roles/:roleId"
            element={
              <RequirePermission permission="roles:view" title="Roles & Permissions">
                <RoleDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="/staff"
            element={
              <RequirePermission permission="staff:view" title="Staff Management">
                <StaffPage />
              </RequirePermission>
            }
          />
          <Route
            path="/staff/:staffId"
            element={
              <RequirePermission permission="staff:view" title="Staff Management">
                <StaffDetailPage />
              </RequirePermission>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
