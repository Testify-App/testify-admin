import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChartNoAxesCombined, CircleCheck, OctagonAlert, Pencil, Send } from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DetailRow, InfoCard, Panel } from '@/components/testify/panel'
import { buttonClass } from '@/components/testify/button-class'
import { cn, initials } from '@/lib/utils'
import { errorMessage } from '@/lib/api/base-api'
import { usePermission } from '@/features/auth/use-permission'
import { useGetStaffActivityQuery, useGetStaffMemberQuery } from '@/features/roles/access-api'
import { formatDate, formatDateTime, staffName } from '@/features/roles/model'
import { useIsOwnAccount } from '@/features/roles/use-access'
import { StatusBadge } from '@/features/roles/components/status-badge'
import { EditStaffDialog } from './components/edit-staff-dialog'
import { SuspendStaffDialog } from './components/suspend-staff-dialog'
import { useStaffCommands } from './use-staff-commands'

const ACTIVITY_PAGE = 10

export function StaffDetailPage() {
  const { staffId = '' } = useParams()
  const { data: person, isLoading, error } = useGetStaffMemberQuery(staffId)
  const [shown, setShown] = useState(ACTIVITY_PAGE)
  const { data: activity, isFetching: loadingActivity } = useGetStaffActivityQuery(
    { id: staffId, limit: shown },
    { skip: !person },
  )
  const ownAccount = useIsOwnAccount(person)
  const canCreate = usePermission('staff:create')
  const canUpdate = usePermission('staff:update')
  const { reactivate, resendInvite } = useStaffCommands()
  const [editing, setEditing] = useState(false)
  const [suspending, setSuspending] = useState(false)

  if (isLoading)
    return (
      <AdminLayout title="View Staff" backTo="/staff">
        <Panel className="px-6 py-[70px] text-center">
          <p role="status" className="text-[14px] text-tf-muted">
            Loading staff member…
          </p>
        </Panel>
      </AdminLayout>
    )

  if (!person) {
    const missing = (error as { status?: unknown } | undefined)?.status === 404
    return (
      <AdminLayout title="View Staff" backTo="/staff">
        <Panel className="flex flex-col items-center gap-4 px-6 py-[70px] text-center">
          <h2 className="text-[20px] font-semibold">
            {missing ? 'Staff member not found' : 'We couldn’t load this staff member'}
          </h2>
          {!missing && <p className="text-[14px] text-tf-muted">{errorMessage(error)}</p>}
          <Link to="/staff" className={cn(buttonClass.primary, 'h-11 text-[14px]')}>
            Back to Staff
          </Link>
        </Panel>
      </AdminLayout>
    )
  }
  const entries = activity?.items ?? []

  const name = staffName(person)
  const details = [
    ['Date Invited', formatDate(person.createdAt)],
    ['Last Login', person.lastLogin ? formatDateTime(person.lastLogin) : '—'],
    [
      'Role',
      person.roleId && person.roleName ? (
        <Link key="role" to={`/roles/${person.roleId}`} className="text-tf-lime hover:underline">
          {person.roleName}
        </Link>
      ) : (
        'Unassigned'
      ),
    ],
    ['Phone Number', person.phone || '—'],
  ] as const

  return (
    <AdminLayout title="View Staff" backTo="/staff">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        <InfoCard aria-label="Staff details">
          <div className="flex items-start gap-4 border-b border-tf-line pb-6">
            <span
              aria-hidden
              className="grid size-[60px] shrink-0 place-items-center rounded-full bg-tf-lavender text-[20px] font-semibold text-tf-panel"
            >
              {initials(name)}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[22px] leading-7 font-semibold break-words">{name}</h2>
              <p className="mt-1 text-[14px] break-all text-tf-muted">{person.email}</p>
            </div>
            <StatusBadge
              status={person.status}
              label={person.status === 'Inactive' ? 'Suspended' : person.status}
            />
          </div>
          <h3 className="mt-6 text-[16px] font-semibold">Additional Information</h3>
          <dl className="mt-5 space-y-5">
            {details.map(([label, value]) => (
              <DetailRow key={label} label={label}>
                {value}
              </DetailRow>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3 border-t border-tf-line pt-6 empty:hidden">
            {canUpdate && (
              <button
                type="button"
                className={cn(buttonClass.outline, 'h-12 px-5 text-[14px]')}
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-4" aria-hidden />
                Edit Details
              </button>
            )}
            {person.status === 'Pending' ? (
              canCreate && (
                <button
                  type="button"
                  className={cn(buttonClass.primary, 'h-12 px-5 text-[14px]')}
                  onClick={() => void resendInvite(person)}
                >
                  <Send className="size-4" aria-hidden />
                  Resend Invite
                </button>
              )
            ) : ownAccount || !canUpdate ? null : person.status === 'Active' ? (
              person.isRoot ? null : (
                <button
                  type="button"
                  className={cn(buttonClass.danger, 'h-12 px-5 text-[14px]')}
                  onClick={() => setSuspending(true)}
                >
                  <OctagonAlert className="size-4" aria-hidden />
                  Suspend Admin
                </button>
              )
            ) : (
              <button
                type="button"
                className={cn(
                  buttonClass.primary,
                  'h-12 bg-tf-green px-5 text-[14px] text-white hover:bg-[#1ea951]',
                )}
                onClick={() => void reactivate(person)}
              >
                <CircleCheck className="size-4" aria-hidden />
                Reactivate Admin
              </button>
            )}
          </div>
        </InfoCard>

        <InfoCard title="Activity Log" aria-label="Activity Log" className="min-h-[520px]">
          {entries.length ? (
            <>
              <ol aria-label="Activity entries" className="mt-4 divide-y divide-tf-line">
                {entries.map((entry) => (
                  <li key={entry.id} className="flex gap-4 py-4">
                    <span
                      aria-hidden
                      className="mt-1.5 size-2.5 shrink-0 rounded-full bg-tf-lime ring-4 ring-tf-lime/15"
                    />
                    <div className="min-w-0 text-[14px] leading-5">
                      <p>{entry.text}</p>
                      {entry.detail && <p className="mt-1 text-tf-muted">Reason: {entry.detail}</p>}
                      <time
                        dateTime={entry.createdAt}
                        className="mt-1 block text-[12px] text-tf-dim"
                      >
                        {formatDateTime(entry.createdAt)}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
              {(activity?.total ?? 0) > entries.length && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    className={cn(buttonClass.outline, 'h-11 text-[14px]')}
                    disabled={loadingActivity}
                    onClick={() => setShown(shown + ACTIVITY_PAGE)}
                  >
                    {loadingActivity ? 'Loading…' : 'Show more'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <ChartNoAxesCombined className="mb-6 size-24 stroke-1 text-tf-dim" aria-hidden />
              <h4 className="text-[18px] font-semibold">No Activity Yet</h4>
              <p className="mt-2 max-w-60 text-[14px] text-tf-muted">
                Actions and changes made to this staff member will be displayed here.
              </p>
            </div>
          )}
        </InfoCard>
      </div>

      {editing && (
        <EditStaffDialog key={person.id} staff={person} onClose={() => setEditing(false)} />
      )}
      {suspending && (
        <SuspendStaffDialog key={person.id} staff={person} onClose={() => setSuspending(false)} />
      )}
    </AdminLayout>
  )
}
