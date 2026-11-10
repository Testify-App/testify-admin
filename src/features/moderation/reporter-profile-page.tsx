import { Link, useParams } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/admin-layout'
import { InfoCard, Panel } from '@/components/testify/panel'
import { buttonClass } from '@/components/testify/button-class'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useGetReportQuery, useGetUserReportsQuery, type ReportDetail } from './moderation-api'
import {
  AccountOverview,
  AccountStatusText,
  FooterNote,
  OutcomePill,
  ProfileIntro,
  ProfileSummary,
} from './profile-parts'
import { ReportLoading, ReportNotFound } from './report-detail-page'
import { ReportedContent } from './reported-content'
import { outcomeLabel, reportStatusLabel } from './report-status'
import { reportSummary, shortId } from './report-format'

export function ReporterProfilePage() {
  const { reportId = '' } = useParams()
  const { data: report, isLoading, error } = useGetReportQuery(reportId)
  if (isLoading) return <ReportLoading />
  if (!report) return <ReportNotFound error={error} />
  return <ReporterProfile report={report} />
}

function ReporterProfile({ report }: { report: ReportDetail }) {
  const reporter = report.reporter
  const { data: submitted, isLoading } = useGetUserReportsQuery({
    userId: reporter.id,
    role: 'reporter',
  })
  const history = submitted?.items ?? []
  const total = submitted?.total ?? report.reporterProfile.reportsSubmitted
  const open = history.filter((row) => row.status !== 'resolved').length
  const name = reporter.displayName || reporter.username || 'Unknown member'
  const backTo = `/moderation/${report.id}`

  return (
    <AdminLayout title="Back to Report" backTo={backTo}>
      <Panel className="px-4 pt-[34px] pb-8 sm:px-8">
        <ProfileIntro
          crumbs={[
            { label: 'Moderation Queue', to: '/moderation' },
            { label: shortId(report.id), to: backTo },
            { label: 'Reporter Profile' },
          ]}
          title="Reporter Profile"
          description="Review the reporter’s account and submission history before returning to the report."
        />
        <ProfileSummary
          member={{ name, username: reporter.username, standing: 'active' }}
          subtitle={`Reporter for ${shortId(report.id)}`}
          stats={[
            { value: total, label: 'Reports submitted' },
            { value: history.length - open, label: 'Reports resolved' },
            { value: open, label: 'Reports open' },
          ]}
        />

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,765fr)_minmax(0,458fr)]">
          <div className="flex min-w-0 flex-col gap-8">
            <InfoCard
              title="Current report submission"
              action={<OutcomePill>{reportStatusLabel[report.status]}</OutcomePill>}
            >
              <div className="mt-[27px]">
                <ReportedContent report={report} thumbClassName="size-[88px]" />
              </div>
              <dl className="mt-[26px] grid gap-5 border-t border-[#3d424c] pt-[24px] sm:grid-cols-[218px_288px_1fr] sm:gap-0">
                {[
                  ['Report ID', shortId(report.id)],
                  ['Report submitted', formatDateTime(report.createdAt)],
                  ['Reason', report.reason],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[14px] leading-5 text-tf-muted">{label}</dt>
                    <dd className="mt-[10px] text-[16px] leading-[22px] font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-[27px] text-[14px] leading-5 text-tf-muted">Additional details</p>
              <p className="mt-[10px] text-[16px] leading-[22px]">
                {report.details || 'No details were added.'}
              </p>
              <div className="mt-[26px] flex justify-end">
                <Link to={backTo} className={cn(buttonClass.primary, 'w-full sm:w-[278px]')}>
                  Return to {shortId(report.id)}
                </Link>
              </div>
            </InfoCard>

            <InfoCard title="Report submission history">
              <p className="mt-[7px] text-[14px] leading-5 text-tf-muted">
                Reports submitted by @{reporter.username}. These are not reports against this
                account.
              </p>
              <div className="mt-[25px] overflow-x-auto rounded-[16px] bg-tf-page">
                <table className="w-full min-w-[620px] border-collapse text-left">
                  <thead>
                    <tr className="h-[47px] bg-tf-field text-[13px] text-[#c6c6c6] [&>th]:font-normal">
                      <th className="pl-5">Report ID</th>
                      <th>Content / reason</th>
                      <th>Submitted</th>
                      <th className="pr-5 text-right">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="h-20 pl-5 text-[14px] text-tf-muted">
                          Loading submissions…
                        </td>
                      </tr>
                    ) : (
                      history.map((row) => {
                        const isCurrent = row.id === report.id
                        return (
                          <tr
                            key={row.id}
                            className={cn(
                              'h-[88px] border-b border-tf-rule last:border-0',
                              isCurrent && 'bg-[#111613]',
                            )}
                          >
                            <td className="w-[123px] pl-5">
                              <Link
                                to={`/moderation/${row.id}`}
                                className={cn(
                                  'text-[14px] font-semibold hover:text-tf-lime',
                                  isCurrent && 'text-tf-lime',
                                )}
                              >
                                {shortId(row.id)}
                              </Link>
                              {isCurrent && (
                                <p className="mt-[2px] text-[11px] text-tf-muted">Current report</p>
                              )}
                            </td>
                            <td className="max-w-[260px]">
                              <p className="truncate text-[14px]">{reportSummary(row)}</p>
                              <p className="mt-[4px] text-[12px] text-tf-muted">{row.reason}</p>
                            </td>
                            <td className="w-[150px] text-[14px] text-[#c6c6c6]">
                              {formatDate(row.createdAt)}
                            </td>
                            <td className="pr-5 text-right">
                              <OutcomePill muted className="h-[37px] px-[15px] text-[12px]">
                                {outcomeLabel(row)}
                              </OutcomePill>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-6 text-[13px] leading-5 text-tf-muted">
                Showing {history.length} of {total} submitted reports
              </p>
            </InfoCard>
          </div>

          <div className="flex min-w-0 flex-col gap-8">
            <AccountOverview
              groups={[
                {
                  heading: 'Account details',
                  rows: [
                    { label: 'Name', value: name },
                    { label: 'Username', value: `@${reporter.username}` },
                    { label: 'Joined', value: formatDate(report.reporterProfile.createdAt) },
                    { label: 'Current report', value: shortId(report.id) },
                  ],
                },
                {
                  heading: 'Moderation summary',
                  rows: [
                    { label: 'Reports submitted', value: total },
                    {
                      label: 'Reports against this user',
                      value: report.reporterProfile.reportsAgainst,
                    },
                    { label: 'Account Status', value: <AccountStatusText standing="active" /> },
                  ],
                },
              ]}
            />
            <InfoCard title="Reports against this user">
              <p className="mt-6 flex items-center gap-4">
                <span className="text-[36px] leading-10 font-medium">
                  {report.reporterProfile.reportsAgainst}
                </span>
                <span className="text-[14px] leading-5 text-tf-muted">
                  {report.reporterProfile.reportsAgainst === 0
                    ? `No reports against ${name} on record.`
                    : `Reports against ${name} on record.`}
                </span>
              </p>
              <p className="mt-5 border-t border-[#3d424c] pt-[22px] text-[14px] leading-[21px] text-[#c6c6c6]">
                Submission history is shown separately and does not count as account violations.
              </p>
            </InfoCard>
            <InfoCard title="Moderation context">
              <p className="mt-[19px] text-[14px] leading-[21px] text-tf-muted">
                Review each report on its own merits. Return to {shortId(report.id)} to add notes or
                resolve it.
              </p>
              <Link to={backTo} className={cn(buttonClass.outline, 'mt-[25px] w-full')}>
                Back to Report
              </Link>
            </InfoCard>
          </div>
        </div>
        <FooterNote>
          For moderation use only · Reporter information is not shared with the content owner.
        </FooterNote>
      </Panel>
    </AdminLayout>
  )
}
