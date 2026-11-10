import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DetailRow, InfoCard, InitialsAvatar, Panel } from '@/components/testify/panel'
import { buttonClass } from '@/components/testify/button-class'
import { SelectField } from '@/components/testify/select-field'
import { StatusPill } from '@/components/testify/status-pill'
import { SuccessDialog } from '@/components/testify/testify-dialog'
import { errorMessage } from '@/lib/api/base-api'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { usePermissionCheck } from '@/features/auth/use-permission'
import { useGetWarningTemplatesQuery } from '@/features/users/users-api'
import {
  useGetReportQuery,
  useResolveReportMutation,
  useStartReviewMutation,
  type AccountAction,
  type Decision,
  type ReportDetail,
} from './moderation-api'
import { ReportedContent } from './reported-content'
import { shortId } from './report-format'
import { accountActionLabels, outcomeLabel, standingLabel } from './report-status'

const decisions: Array<{ value: Decision; title: string; description: string }> = [
  {
    value: 'no_action',
    title: 'No Action',
    description: 'The content follows community guidelines and can stay up.',
  },
  {
    value: 'remove_content',
    title: 'Remove Content',
    description: 'Hide the testimony or comment because it violates community guidelines.',
  },
  {
    value: 'account_action',
    title: 'Take Account Action',
    description: 'Warn, suspend or ban the member who posted it.',
  },
]

// Each account action also needs the matching Users permission (checked by the API too).
const actionPermission: Record<AccountAction, string> = {
  warning: 'users:warn',
  suspend: 'users:update',
  ban: 'users:ban',
}

const durationOptions = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: 'indefinite', label: 'Indefinite' },
]

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-[13px] leading-4 text-tf-dim">{label}</dt>
      <dd className="mt-[10px] text-[16px] leading-[22px] font-semibold break-words">{children}</dd>
    </div>
  )
}

export function ReportNotFound({ error }: { error?: unknown }) {
  return (
    <AdminLayout title="Back" backTo="/moderation">
      <Panel className="px-8 py-16 text-center">
        <h2 className="text-[24px] font-semibold">
          {error && (error as { status?: unknown }).status !== 404
            ? 'We couldn’t load this report'
            : 'Report not found'}
        </h2>
        <p className="mt-3 text-tf-muted">
          {error && (error as { status?: unknown }).status !== 404
            ? errorMessage(error)
            : 'It may have been removed or the link is incorrect.'}
        </p>
        <Link to="/moderation" className={cn(buttonClass.primary, 'mt-8')}>
          Back to Moderation Queue
        </Link>
      </Panel>
    </AdminLayout>
  )
}

export function ReportLoading({ backTo = '/moderation' }: { backTo?: string }) {
  return (
    <AdminLayout title="Back" backTo={backTo}>
      <Panel className="px-8 py-16 text-center">
        <p role="status" className="text-tf-muted">
          Loading report…
        </p>
      </Panel>
    </AdminLayout>
  )
}

export function ReportDetailPage() {
  const { reportId = '' } = useParams()
  const { data: report, isLoading, error } = useGetReportQuery(reportId)
  if (isLoading) return <ReportLoading />
  if (!report) return <ReportNotFound error={error} />
  return <ReportReview key={report.id} report={report} />
}

function ReportReview({ report }: { report: ReportDetail }) {
  const navigate = useNavigate()
  const can = usePermissionCheck()
  const canAct = can('moderation:update')
  const [startReview, { isLoading: starting }] = useStartReviewMutation()
  const [resolve, { isLoading: resolving }] = useResolveReportMutation()
  const { data: templates = [] } = useGetWarningTemplatesQuery(undefined, {
    skip: !can('users:view'),
  })
  const [notes, setNotes] = useState('')
  const [decision, setDecision] = useState<Decision>('no_action')
  const [accountAction, setAccountAction] = useState<AccountAction | ''>('')
  const [duration, setDuration] = useState('7')
  const [template, setTemplate] = useState('')
  const [notify, setNotify] = useState(true)
  const [showActionError, setShowActionError] = useState(false)
  const [resolved, setResolved] = useState(false)

  const isClosed = report.status === 'resolved'
  const canRemove = report.entityType === 'post' || report.entityType === 'comment'
  const actionOptions = (Object.keys(accountActionLabels) as AccountAction[])
    .filter((action) => can(actionPermission[action]))
    .map((value) => ({ value, label: accountActionLabels[value] }))
  const submitLabel =
    decision === 'account_action'
      ? accountActionLabels[accountAction || 'warning']
      : decision === 'remove_content'
        ? 'Remove Content'
        : 'Resolve Report'

  async function submit() {
    if (decision === 'account_action' && !accountAction) return setShowActionError(true)
    try {
      await resolve({
        id: report.id,
        decision,
        accountAction: accountAction || undefined,
        durationDays: duration === 'indefinite' ? null : Number(duration),
        warningTemplate: template || undefined,
        notes,
        notify,
      }).unwrap()
      setResolved(true)
    } catch (cause) {
      toast.error(errorMessage(cause))
    }
  }

  const owner = report.owner
  const ownerName = owner.displayName || owner.username || 'Unknown member'
  const reporterName = report.reporter.displayName || report.reporter.username || 'Unknown member'

  return (
    <AdminLayout title="Back" backTo="/moderation">
      <Panel className="px-4 pt-6 pb-8 sm:px-8 sm:pt-[37px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[24px] leading-8 font-semibold" title={report.id}>
              Report #{shortId(report.id)}
            </h2>
            <p className="mt-[21px] text-[15px] leading-5 text-[#74787f]">
              Review report details and decide what happens next.
            </p>
          </div>
          {report.status === 'pending' && canAct ? (
            <button
              type="button"
              disabled={starting}
              onClick={async () => {
                try {
                  await startReview(report.id).unwrap()
                  toast.success(`Report ${shortId(report.id)} marked as under review`)
                } catch (cause) {
                  toast.error(errorMessage(cause))
                }
              }}
              className={cn(
                buttonClass.outline,
                'h-14 w-full gap-[14px] border-tf-outline font-medium text-tf-grey hover:text-white sm:-mt-[5px] sm:w-[275px]',
              )}
            >
              <Eye
                className="size-5 text-white"
                fill="currentColor"
                stroke="var(--color-tf-panel)"
                aria-hidden
              />
              Mark as Under Review
            </button>
          ) : (
            <StatusPill
              tone={isClosed ? 'published' : report.status === 'pending' ? 'pending' : 'review'}
              className="h-10 px-5 text-[14px]"
            >
              {isClosed
                ? outcomeLabel(report)
                : report.status === 'pending'
                  ? 'Pending'
                  : 'Under Review'}
            </StatusPill>
          )}
        </div>

        <div className="mt-9 grid gap-8 xl:grid-cols-[minmax(0,765fr)_minmax(0,458fr)]">
          <div className="flex min-w-0 flex-col gap-8">
            <InfoCard title="Report Information">
              <dl className="mt-[34px] grid gap-6 sm:grid-cols-[190px_288px_1fr] sm:gap-0">
                <Field label="Report ID">{shortId(report.id)}</Field>
                <Field label="Date & Time">{formatDateTime(report.createdAt)}</Field>
                <Field label="Reason">{report.reason}</Field>
                <Field
                  label="Additional details"
                  className="sm:col-span-3 sm:mt-[35px] [&_dd]:mt-[11px] [&_dd]:font-normal"
                >
                  {report.details || 'No details were added.'}
                </Field>
              </dl>
              {report.related.length > 0 && (
                <div className="mt-8 border-t border-[#3d424c] pt-6">
                  <p className="text-[14px] font-semibold">
                    {report.related.length} other{' '}
                    {report.related.length === 1 ? 'report' : 'reports'} on this content
                  </p>
                  <ul className="mt-3 space-y-2 text-[14px] text-tf-muted">
                    {report.related.map((item) => (
                      <li key={item.id}>
                        <Link
                          to={`/moderation/${item.id}`}
                          className="text-white hover:text-tf-lime"
                        >
                          {shortId(item.id)}
                        </Link>{' '}
                        · {item.reason} · @{item.reporterUsername} · {formatDate(item.createdAt)}
                      </li>
                    ))}
                  </ul>
                  {!isClosed && (
                    <p className="mt-3 text-[13px] text-tf-dim">
                      Resolving this report also closes the other open reports on the same content.
                    </p>
                  )}
                </div>
              )}
            </InfoCard>

            <InfoCard title="Reported Content">
              <div className="mt-[31px]">
                <ReportedContent report={report} />
              </div>
              {report.engagement.likes !== null && (
                <p className="mt-6 text-[14px] text-tf-muted">
                  {report.engagement.likes} likes · {report.engagement.comments} comments ·{' '}
                  {report.engagement.reports} reports
                </p>
              )}
            </InfoCard>

            <InfoCard title="Moderator Review">
              {isClosed ? (
                <dl className="mt-[29px] space-y-5">
                  <DetailRow label="Outcome">{outcomeLabel(report)}</DetailRow>
                  <DetailRow label="Resolved">{formatDateTime(report.resolvedAt)}</DetailRow>
                  <DetailRow label="Moderator">{report.moderator?.name ?? '—'}</DetailRow>
                  <DetailRow label="Notes">{report.notes || '—'}</DetailRow>
                </dl>
              ) : !canAct ? (
                <p className="mt-[29px] text-[14px] text-tf-muted">
                  You can view this report but not resolve it. Ask an administrator for the
                  moderation update permission.
                </p>
              ) : (
                <>
                  <label
                    htmlFor="review-notes"
                    className="mt-[29px] block text-[16px] leading-[22px] font-semibold"
                  >
                    Review Notes
                  </label>
                  <textarea
                    id="review-notes"
                    value={notes}
                    maxLength={2000}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add internal notes about this report..."
                    className="mt-3 h-[163px] w-full resize-none rounded-[20px] bg-tf-field px-6 pt-[17px] pb-4 text-[15px] leading-6 text-white outline-none placeholder:text-tf-faint focus-visible:ring-1 focus-visible:ring-tf-lime/70"
                  />

                  <fieldset className="mt-6">
                    <legend className="text-[16px] leading-[22px] font-semibold">
                      What action should be taken?
                    </legend>
                    <div className="mt-3 grid gap-4 sm:grid-cols-3">
                      {decisions.map((option) => {
                        const checked = decision === option.value
                        const disabled =
                          (option.value === 'remove_content' && !canRemove) ||
                          (option.value === 'account_action' && actionOptions.length === 0)
                        return (
                          <label
                            key={option.value}
                            className={cn(
                              'relative flex min-h-[124px] cursor-pointer flex-col rounded-[20px] border bg-tf-field pt-10 pr-4 pb-4 pl-[19px] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tf-lime/50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
                              checked ? 'border-tf-lime' : 'border-transparent',
                            )}
                          >
                            <input
                              type="radio"
                              name="decision"
                              value={option.value}
                              checked={checked}
                              disabled={disabled}
                              onChange={() => {
                                setDecision(option.value)
                                setShowActionError(false)
                              }}
                              className="sr-only"
                            />
                            <span
                              aria-hidden
                              className={cn(
                                'absolute top-[19px] right-[21px] grid size-4 place-items-center rounded-full border-[1.5px]',
                                checked ? 'border-tf-lime text-tf-lime' : 'border-tf-grey',
                              )}
                            >
                              {checked && <Check className="size-2.5" strokeWidth={3.5} />}
                            </span>
                            <span className="text-[14px] leading-5">{option.title}</span>
                            <span className="mt-[4px] text-[11px] leading-4 text-tf-faint">
                              {option.value === 'remove_content' && !canRemove
                                ? 'Only testimonies and comments can be removed.'
                                : option.description}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>

                  {decision === 'account_action' && (
                    <div className="mt-[31px] grid gap-5 sm:grid-cols-2">
                      <div
                        className={
                          accountAction === 'ban' || !accountAction ? 'sm:col-span-2' : undefined
                        }
                      >
                        <label
                          htmlFor="account-action"
                          className="text-[16px] leading-[22px] font-semibold"
                        >
                          Select Action{' '}
                          <span className="ml-1 text-[#e01111]" aria-hidden>
                            *
                          </span>
                        </label>
                        <SelectField
                          id="account-action"
                          required
                          className="mt-3"
                          options={[
                            { value: '', label: 'Select account action...' },
                            ...actionOptions,
                          ]}
                          value={accountAction}
                          aria-invalid={showActionError || undefined}
                          aria-describedby={showActionError ? 'account-action-error' : undefined}
                          placeholderClassName="text-[#7d8087]"
                          onValueChange={(value) => {
                            setAccountAction(value as AccountAction | '')
                            setShowActionError(false)
                          }}
                        />
                        {showActionError && (
                          <p
                            id="account-action-error"
                            role="alert"
                            className="mt-2 pl-6 text-[13px] text-[#f97066]"
                          >
                            Select an account action to continue.
                          </p>
                        )}
                      </div>
                      {accountAction === 'suspend' && (
                        <div>
                          <label
                            htmlFor="suspend-duration"
                            className="text-[16px] leading-[22px] font-semibold"
                          >
                            Suspension length
                          </label>
                          <SelectField
                            id="suspend-duration"
                            className="mt-3"
                            options={durationOptions}
                            value={duration}
                            onValueChange={setDuration}
                          />
                        </div>
                      )}
                      {accountAction === 'warning' && (
                        <div>
                          <label
                            htmlFor="warning-template"
                            className="text-[16px] leading-[22px] font-semibold"
                          >
                            Warning message
                          </label>
                          <SelectField
                            id="warning-template"
                            className="mt-3"
                            options={[
                              { value: '', label: 'Use my review notes' },
                              ...templates.map((item) => ({ value: item.key, label: item.label })),
                            ]}
                            value={template}
                            onValueChange={setTemplate}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <label className="mt-6 flex cursor-pointer items-center gap-3 text-[14px]">
                    <input
                      type="checkbox"
                      checked={notify}
                      onChange={(event) => setNotify(event.target.checked)}
                      className="size-4 accent-[#d9ef00]"
                    />
                    Notify the member about this decision
                  </label>

                  <div className="mt-10 flex justify-end">
                    <button
                      type="button"
                      onClick={submit}
                      disabled={resolving}
                      className={cn(buttonClass.primary, 'w-full sm:w-[277px]')}
                    >
                      {resolving ? 'Saving…' : submitLabel}
                    </button>
                  </div>
                </>
              )}
            </InfoCard>
          </div>

          <div className="flex min-w-0 flex-col gap-8">
            <InfoCard title="Reported By">
              <div className="mt-6 flex items-center gap-3">
                <InitialsAvatar name={reporterName} />
                <div>
                  <p className="text-[16px] leading-5 text-tf-dim">{reporterName}</p>
                  <p className="mt-[2px] text-[14px] leading-5 font-semibold">
                    @{report.reporter.username}
                  </p>
                </div>
              </div>
              <dl className="mt-[17px] space-y-[26px] border-t border-[#3d424c] pt-[22px] [&_dt]:text-tf-dim">
                <DetailRow label="Report submitted">{formatDateTime(report.createdAt)}</DetailRow>
                <DetailRow label="Reports submitted">
                  {report.reporterProfile.reportsSubmitted}
                </DetailRow>
              </dl>
              <Link
                to={`/moderation/${report.id}/reporter`}
                className={cn(buttonClass.primary, 'mt-[37px] w-full')}
              >
                View Reporter Profile
              </Link>
            </InfoCard>

            <InfoCard title="Content Owner">
              <div className="mt-[23px] flex items-center gap-3">
                <InitialsAvatar name={ownerName} />
                <div>
                  <p className="text-[16px] leading-5 text-tf-dim">{ownerName}</p>
                  <p className="mt-[2px] text-[14px] leading-5 font-semibold">@{owner.username}</p>
                </div>
              </div>
              <dl className="mt-4 space-y-[26px] border-t border-[#3d424c] pt-[22px] [&_dt]:text-tf-dim">
                <DetailRow label="Joined">{formatDate(report.ownerProfile.createdAt)}</DetailRow>
                <DetailRow label="Reports against">{report.ownerProfile.reportsAgainst}</DetailRow>
                <DetailRow label="Warnings">{report.ownerProfile.warnings}</DetailRow>
                <DetailRow label="Account Status">
                  <span
                    className={cn(
                      'flex items-center gap-[7px]',
                      owner.standing === 'active'
                        ? 'text-tf-green'
                        : owner.standing === 'banned'
                          ? 'text-tf-red'
                          : 'text-tf-gold',
                    )}
                  >
                    <span className="size-[5px] rounded-full bg-current" aria-hidden />
                    {standingLabel[owner.standing]}
                    {owner.standing === 'suspended' && owner.suspendedUntil
                      ? ` until ${formatDate(owner.suspendedUntil)}`
                      : ''}
                  </span>
                </DetailRow>
              </dl>
              <Link
                to={`/moderation/${report.id}/owner`}
                className={cn(buttonClass.primary, 'mt-[37px] w-full')}
              >
                View Profile
              </Link>
            </InfoCard>
          </div>
        </div>
      </Panel>

      <SuccessDialog
        open={resolved}
        onOpenChange={setResolved}
        icon={<Check strokeWidth={3} />}
        title="Report resolved"
        description={`Report ${shortId(report.id)} has been resolved: ${outcomeLabel({ status: 'resolved', decision, accountAction: accountAction || null }).toLowerCase()}.`}
        onDone={() => navigate('/moderation')}
      />
    </AdminLayout>
  )
}
