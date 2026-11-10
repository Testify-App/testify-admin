import { StatusPill } from '@/components/testify/status-pill'
import { formatDate } from '@/lib/format'
import { ContentThumb } from './content-thumb'
import type { ReportItem } from './moderation-api'
import { entityLabel } from './report-status'
import { reportSummary, shortId } from './report-format'

/** The reported testimony, comment, account or message, as shown on report screens. */
export function ReportedContent({
  report,
  thumbClassName = 'size-[158px]',
}: {
  report: ReportItem
  thumbClassName?: string
}) {
  const isAccount = report.entityType === 'user'
  return (
    <div className="flex flex-col gap-5 sm:flex-row">
      <ContentThumb
        media={report.content.media}
        type={report.entityType}
        className={thumbClassName}
      />
      <div className="min-w-0 flex-1">
        <h3 className="text-[20px] leading-7 break-words whitespace-pre-line">
          {isAccount ? `@${report.owner.username ?? 'unknown'}` : reportSummary(report)}
        </h3>
        {isAccount && report.content.text && (
          <p className="mt-2 text-[14px] leading-5 text-tf-muted">Bio: {report.content.text}</p>
        )}
        <p className="mt-[7px] text-[13px] leading-5 text-tf-dim">
          {isAccount ? 'Reported account' : `By @${report.owner.username ?? 'unknown'}`} · Testify
        </p>
        <p className="mt-3 text-[14px] leading-5 text-[#c6c6c6]">
          <span title={report.entityId}>{shortId(report.entityId)}</span>
          <span className="mx-[6px]">·</span>
          {entityLabel[report.entityType]}
          <span className="mx-[6px]">·</span>
          {isAccount ? 'Joined ' : ''}
          {formatDate(report.content.createdAt)}
        </p>
        {(report.content.hidden || report.content.deleted) && (
          <StatusPill tone={report.content.hidden ? 'removed' : 'neutral'} className="mt-3">
            {report.content.hidden
              ? 'Removed by moderation'
              : report.entityType === 'user'
                ? 'Account deleted'
                : report.entityType === 'message'
                  ? 'Unsent by sender'
                  : 'Deleted by author'}
          </StatusPill>
        )}
      </div>
    </div>
  )
}
