import type { PillTone } from '@/components/testify/status-pill'
import type {
  AccountAction,
  Decision,
  ReportEntityType,
  ReportStatus,
  Standing,
} from './moderation-api'

export const reportStatusLabel: Record<ReportStatus, string> = {
  pending: 'Pending',
  'under-review': 'Under Review',
  resolved: 'Resolved',
}
export const reportStatusTone: Record<ReportStatus, PillTone> = {
  pending: 'pending',
  'under-review': 'review',
  resolved: 'published',
}

export const entityLabel: Record<ReportEntityType, string> = {
  post: 'Testimony',
  comment: 'Comment',
  user: 'Account',
  message: 'Message',
}

export const standingLabel: Record<Standing, string> = {
  active: 'Active',
  suspended: 'Suspended',
  banned: 'Banned',
}
export const standingTone: Record<Standing, PillTone> = {
  active: 'active',
  suspended: 'warning',
  banned: 'removed',
}

export const accountActionLabels: Record<AccountAction, string> = {
  warning: 'Issue Warning',
  suspend: 'Suspend Account',
  ban: 'Ban Account',
}

/** Outcome text for a resolved report, e.g. “Content removed”. */
export function outcomeLabel(report: {
  status: ReportStatus
  decision: Decision | null
  accountAction: AccountAction | null
}) {
  if (report.status !== 'resolved') return reportStatusLabel[report.status]
  if (report.decision === 'remove_content') return 'Content removed'
  if (report.decision === 'account_action')
    return report.accountAction === 'warning'
      ? 'Warning issued'
      : report.accountAction === 'ban'
        ? 'Account banned'
        : 'Account suspended'
  return 'No action'
}
