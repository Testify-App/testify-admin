import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban, CircleCheck, Clock, Copy, OctagonAlert, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { AdminLayout } from '@/components/layout/admin-layout'
import { InfoCard, Panel } from '@/components/testify/panel'
import { buttonClass } from '@/components/testify/button-class'
import { Pagination } from '@/components/testify/pagination'
import { SelectField } from '@/components/testify/select-field'
import { StatusPill } from '@/components/testify/status-pill'
import { errorMessage } from '@/lib/api/base-api'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { usePermissionCheck } from '@/features/auth/use-permission'
import type { ReportDetail } from '@/features/moderation/moderation-api'
import {
  AccountOverview,
  AccountStatusText,
  FooterNote,
  OutcomePill,
  ProfileIntro,
  ProfileSummary,
} from '@/features/moderation/profile-parts'
import { ReportedContent } from '@/features/moderation/reported-content'
import { ContentThumb } from '@/features/moderation/content-thumb'
import { reportStatusLabel } from '@/features/moderation/report-status'
import { shortId } from '@/features/moderation/report-format'
import { AccountActionDialog, type AccountDialog } from './components/account-action-dialogs'
import { NotesPanel } from './components/notes-panel'
import {
  useGetAppUserQuery,
  useGetFlaggedContentQuery,
  useGetModerationHistoryQuery,
  type AppUserProfile,
  type HistoryEntry,
} from './users-api'

const historyLabel: Record<HistoryEntry['kind'], string> = {
  suspend: 'Suspended',
  extend: 'Suspension changed',
  ban: 'Banned',
  reinstate: 'Reinstated',
  expire: 'Suspension expired',
  warning: 'Warning sent',
}
const historyTone = {
  suspend: 'warning',
  extend: 'warning',
  ban: 'removed',
  reinstate: 'active',
  expire: 'active',
  warning: 'pending',
} as const

const flaggedSorts = [
  { value: 'recent', label: 'Most recently flagged' },
  { value: 'severity', label: 'Most severe' },
  { value: 'reports', label: 'Most reports' },
]

function MetadataCard({ user }: { user: AppUserProfile }) {
  const s = user.stats
  const items: [string, string | number][] = [
    ['Testimonies', s.posts],
    ['Comments', s.comments],
    ['Likes given', s.likesGiven],
    ['Likes received', s.likesReceived],
    ['Tribe (following)', s.tribeFollowing],
    ['Tribe (followers)', s.tribeFollowers],
    ['Circle', s.circle],
    ['Communities', s.communities],
    ['Removed by moderation', s.hiddenPosts + s.hiddenComments],
    ['Reports submitted', s.reportsSubmitted],
  ]
  return (
    <InfoCard
      title="Account Metadata"
      action={<span className="text-[13px] text-tf-muted">Read-only · live</span>}
    >
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-5">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[12px] leading-4 text-tf-dim">{label}</dt>
            <dd className="mt-2 text-[20px] leading-6 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </InfoCard>
  )
}

function FlaggedContentCard({ userId }: { userId: string }) {
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useGetFlaggedContentQuery({ userId, sort, page })
  return (
    <InfoCard
      title="Flagged Content History"
      action={
        <SelectField
          aria-label="Sort flagged content"
          size="sm"
          className="w-[200px]"
          options={flaggedSorts}
          value={sort}
          onValueChange={(value) => {
            setSort(value)
            setPage(1)
          }}
        />
      }
    >
      {isLoading ? (
        <p className="mt-6 text-[14px] text-tf-muted">Loading flagged content…</p>
      ) : isError ? (
        <p className="mt-6 text-[14px] text-tf-muted">We couldn’t load the flagged content.</p>
      ) : !data?.items.length ? (
        <p className="mt-6 text-[14px] text-tf-muted">
          None of this member’s content has been reported.
        </p>
      ) : (
        <>
          <ul className="mt-5 divide-y divide-[#2f3540]" aria-label="Flagged content">
            {data.items.map((item) => (
              <li key={`${item.entityType}-${item.entityId}`} className="flex gap-4 py-4">
                <ContentThumb media={item.media} type={item.entityType} className="size-16" />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/moderation?search=${encodeURIComponent(item.entityId)}`}
                    className="line-clamp-2 text-[15px] leading-5 hover:text-tf-lime"
                    title="Open the reports on this content"
                  >
                    {item.content?.trim() || 'Media only'}
                  </Link>
                  <p className="mt-1 text-[12px] text-tf-dim">
                    {item.entityType === 'post' ? 'Testimony' : 'Comment'} · Posted{' '}
                    {formatDate(item.postedAt)} · Last flagged {formatDate(item.lastReportedAt)}
                  </p>
                  <p className="mt-1 text-[13px] text-tf-muted">{item.reasons.join(', ')}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                  <span className="text-[13px] font-semibold">
                    {item.reportCount} {item.reportCount === 1 ? 'report' : 'reports'}
                  </span>
                  {item.hidden ? (
                    <OutcomePill className="h-7 px-3 text-[11px]">Content removed</OutcomePill>
                  ) : item.deletedByAuthor ? (
                    <StatusPill tone="neutral" className="h-7 px-3 text-[11px]">
                      Deleted by author
                    </StatusPill>
                  ) : item.hasOpenReports ? (
                    <OutcomePill className="h-7 px-3 text-[11px]">Pending</OutcomePill>
                  ) : (
                    <OutcomePill className="h-7 px-3 text-[11px]">Published</OutcomePill>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {data.totalPages > 1 && (
            <div className="mt-4">
              <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </InfoCard>
  )
}

function HistoryCard({ userId }: { userId: string }) {
  const { data: history = [], isLoading } = useGetModerationHistoryQuery(userId)
  return (
    <InfoCard
      title="Moderation History"
      action={
        <StatusPill tone="neutral" className="h-[33px] px-4">
          {history.length} {history.length === 1 ? 'entry' : 'entries'}
        </StatusPill>
      }
    >
      {isLoading ? (
        <p className="mt-6 text-[14px] text-tf-muted">Loading history…</p>
      ) : history.length === 0 ? (
        <p className="mt-6 text-[14px] text-[#c6c6c6]">
          No warnings, suspensions or bans on record.
        </p>
      ) : (
        <ul className="mt-[17px]">
          {history.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 border-b border-[#2f3540] py-5 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-[15px] leading-[22px] font-semibold">
                  {historyLabel[item.kind]}
                  {item.durationDays
                    ? ` · ${item.durationDays} days`
                    : item.kind === 'suspend'
                      ? ' · indefinite'
                      : ''}
                </p>
                <p className="mt-[3px] text-[13px] leading-5 text-tf-muted">
                  {formatDateTime(item.createdAt)} · {item.performedBy?.name ?? 'System'}
                  {item.endsAt && ` · until ${formatDate(item.endsAt)}`}
                </p>
                {item.reason && (
                  <p className="mt-2 text-[14px] leading-5 text-[#d4d9e3] break-words">
                    {item.reason}
                  </p>
                )}
                {item.note && (
                  <p className="mt-1 text-[13px] leading-5 text-tf-muted">Note: {item.note}</p>
                )}
                {item.kind === 'warning' && (
                  <p className="mt-1 text-[12px] text-tf-dim">
                    {item.acknowledgedAt
                      ? `Acknowledged ${formatDateTime(item.acknowledgedAt)}`
                      : 'Not acknowledged yet'}
                  </p>
                )}
              </div>
              <StatusPill
                tone={historyTone[item.kind]}
                className="mt-[3px] h-[30px] px-3 text-[11px]"
              >
                {historyLabel[item.kind]}
              </StatusPill>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  )
}

function ActionsCard({
  user,
  onOpen,
}: {
  user: AppUserProfile
  onOpen: (dialog: AccountDialog) => void
}) {
  const can = usePermissionCheck()
  const buttons: {
    dialog: AccountDialog
    label: string
    icon: typeof Ban
    show: boolean
    tone: string
  }[] = [
    {
      dialog: 'warning',
      label: 'Send Warning',
      icon: TriangleAlert,
      show: can('users:warn') && user.standing === 'active',
      tone: buttonClass.outline,
    },
    {
      dialog: 'suspend',
      label: 'Suspend Account',
      icon: OctagonAlert,
      show: can('users:update') && user.standing === 'active',
      tone: buttonClass.outline,
    },
    {
      dialog: 'change-suspension',
      label: 'Change Suspension',
      icon: Clock,
      show: can('users:update') && user.standing === 'suspended',
      tone: buttonClass.outline,
    },
    {
      dialog: 'reinstate',
      label: 'Reinstate Account',
      icon: CircleCheck,
      show: can('users:update') && user.standing === 'suspended',
      tone: buttonClass.primary,
    },
    {
      dialog: 'ban',
      label: 'Ban Permanently',
      icon: Ban,
      show: can('users:ban') && user.standing !== 'banned',
      tone: buttonClass.danger,
    },
  ]
  const visible = buttons.filter((button) => button.show)
  return (
    <InfoCard title="Account Actions">
      <p className="mt-[13px] text-[14px] leading-[21px] text-tf-muted">
        @{user.username} is currently <AccountStatusText standing={user.standing} />
        {user.standing === 'suspended' &&
          (user.suspendedUntil ? ` until ${formatDateTime(user.suspendedUntil)}` : ' indefinitely')}
        .{user.standing === 'banned' && ' Bans are permanent.'}
      </p>
      {visible.length ? (
        <div className="mt-6 flex flex-col gap-3">
          {visible.map(({ dialog, label, icon: Icon, tone }) => (
            <button
              key={dialog}
              type="button"
              onClick={() => onOpen(dialog)}
              className={cn(tone, 'h-12 w-full text-[14px]')}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-[13px] text-tf-dim">
          No account actions are available to you for this member.
        </p>
      )}
      <p className="mt-6 border-t border-[#2f3540] pt-[20px] text-[13px] leading-5 text-tf-muted">
        Every action is recorded in this member’s history and the audit log.
      </p>
    </InfoCard>
  )
}

/** Admin view of an app user. With `report`, also shows the report it was opened from. */
export function UserProfile({
  user,
  report,
}: {
  user: AppUserProfile
  report?: ReportDetail | null
}) {
  const can = usePermissionCheck()
  const [dialog, setDialog] = useState<AccountDialog | null>(null)
  const backTo = report ? `/moderation/${report.id}` : '/users'
  return (
    <AdminLayout title={report ? 'Back to Report' : 'Back to Users'} backTo={backTo}>
      <Panel className="px-4 pt-[34px] pb-8 sm:px-8">
        <ProfileIntro
          crumbs={
            report
              ? [
                  { label: 'Moderation Queue', to: '/moderation' },
                  { label: shortId(report.id), to: backTo },
                  { label: 'Content Owner Profile' },
                ]
              : [{ label: 'Users', to: '/users' }, { label: `@${user.username ?? user.id}` }]
          }
          title={report ? 'Content Owner Profile' : 'Member Profile'}
          description="Review the member’s account, activity and moderation history before taking action."
        />
        <ProfileSummary
          member={user}
          subtitle={
            report
              ? `Content owner for ${shortId(report.id)}`
              : `Joined ${formatDate(user.createdAt)}`
          }
          stats={[
            { value: user.stats.reportsAgainst, label: 'Reports against' },
            { value: user.stats.warnings, label: 'Warnings' },
            { value: user.stats.enforcementActions, label: 'Suspensions & bans' },
          ]}
        />

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,760fr)_minmax(0,455fr)]">
          <div className="flex min-w-0 flex-col gap-8">
            {report && (
              <InfoCard
                title="Reported Content"
                action={
                  <StatusPill tone="warning" className="h-[33px] px-4">
                    {shortId(report.id)} · {reportStatusLabel[report.status]}
                  </StatusPill>
                }
              >
                <div className="mt-[25px]">
                  <ReportedContent report={report} thumbClassName="size-[131px]" />
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#3d424c] pt-6">
                  <div>
                    <p className="text-[14px] leading-5 text-[#c6c6c6]">
                      Reported by @{report.reporter.username}
                    </p>
                    <p className="mt-1 text-[13px] leading-5 text-tf-muted">
                      {report.reason} · {formatDateTime(report.createdAt)}
                    </p>
                  </div>
                  <Link to={backTo} className={cn(buttonClass.primary, 'w-full sm:w-[220px]')}>
                    Return to Report
                  </Link>
                </div>
              </InfoCard>
            )}
            <MetadataCard user={user} />
            <FlaggedContentCard userId={user.id} />
            <HistoryCard userId={user.id} />
          </div>

          <div className="flex min-w-0 flex-col gap-8">
            <AccountOverview
              groups={[
                {
                  heading: 'Account details',
                  rows: [
                    { label: 'Name', value: user.name },
                    { label: 'Username', value: `@${user.username ?? '—'}` },
                    { label: 'Email', value: user.email ?? '—' },
                    {
                      label: 'User ID',
                      value: (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 hover:text-tf-lime"
                          onClick={() => {
                            void navigator.clipboard?.writeText(user.id)
                            toast.success('User ID copied')
                          }}
                        >
                          {shortId(user.id)} <Copy className="size-3.5" aria-hidden />
                        </button>
                      ),
                    },
                  ],
                },
                {
                  heading: 'Activity',
                  rows: [
                    { label: 'Joined', value: formatDate(user.createdAt) },
                    { label: 'Last login', value: formatDateTime(user.lastLogin) },
                    {
                      label: 'Account Status',
                      value: <AccountStatusText standing={user.standing} />,
                    },
                  ],
                },
              ]}
            />
            <ActionsCard user={user} onOpen={setDialog} />
            <NotesPanel userId={user.id} canWrite={can('users:update')} />
          </div>
        </div>

        <FooterNote>
          For moderation use only · Account actions and notes are recorded in the audit log.
        </FooterNote>
      </Panel>
      {dialog && (
        <AccountActionDialog dialog={dialog} user={user} onClose={() => setDialog(null)} />
      )}
    </AdminLayout>
  )
}

export function UserProfileState({
  title,
  error,
  loading,
}: {
  title: string
  error?: unknown
  loading?: boolean
}) {
  return (
    <AdminLayout title={title} backTo="/users">
      <Panel className="px-8 py-16 text-center">
        {loading ? (
          <p role="status" className="text-tf-muted">
            Loading member…
          </p>
        ) : (
          <>
            <h2 className="text-[24px] font-semibold">
              {(error as { status?: unknown } | undefined)?.status === 404
                ? 'Member not found'
                : 'We couldn’t load this member'}
            </h2>
            <p className="mt-3 text-tf-muted">
              {(error as { status?: unknown } | undefined)?.status === 404
                ? 'This account may have been deleted.'
                : errorMessage(error)}
            </p>
          </>
        )}
      </Panel>
    </AdminLayout>
  )
}

/** Loads a member by ID and renders their profile. */
export function UserProfileById({
  userId,
  report,
}: {
  userId: string
  report?: ReportDetail | null
}) {
  const { data: user, isLoading, error } = useGetAppUserQuery(userId)
  const title = report ? 'Back to Report' : 'Back to Users'
  if (isLoading) return <UserProfileState title={title} loading />
  if (!user) return <UserProfileState title={title} error={error} />
  return <UserProfile user={user} report={report} />
}
