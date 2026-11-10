import { useParams } from 'react-router-dom'
import { UserProfileById } from '@/features/users/user-profile'
import { useGetReportQuery } from './moderation-api'
import { ReportLoading, ReportNotFound } from './report-detail-page'

/** /moderation/:reportId/owner — the content owner's profile, with the report as context. */
export function ContentOwnerProfilePage() {
  const { reportId = '' } = useParams()
  const { data: report, isLoading, error } = useGetReportQuery(reportId)
  if (isLoading) return <ReportLoading />
  if (!report) return <ReportNotFound error={error} />
  return <UserProfileById userId={report.owner.id} report={report} />
}

/** /users/:userId — the same profile without report context. */
export function MemberProfilePage() {
  const { userId = '' } = useParams()
  return <UserProfileById userId={userId} />
}
