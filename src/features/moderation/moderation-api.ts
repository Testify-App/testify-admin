import { baseApi, toPage, type Page } from '@/lib/api/base-api'
import { BACKOFFICE } from '@/features/auth/auth-api'

// ---- Types used by the screens ---------------------------------------------------------------

export type ReportStatus = 'pending' | 'under-review' | 'resolved'
export type ReportEntityType = 'post' | 'comment' | 'user' | 'message'
export type Decision = 'no_action' | 'remove_content' | 'account_action'
export type AccountAction = 'warning' | 'suspend' | 'ban'
export type Standing = 'active' | 'suspended' | 'banned'

export interface Person {
  id: string
  username: string | null
  displayName: string | null
  avatar: string | null
}

export interface Media {
  url: string
  type?: string
  thumbnailUrl?: string
}

export interface ReportItem {
  id: string
  entityType: ReportEntityType
  entityId: string
  reason: string
  reasonCode: string | null
  severity: number
  details: string | null
  status: ReportStatus
  decision: Decision | null
  accountAction: AccountAction | null
  notes: string | null
  createdAt: string
  reviewStartedAt: string | null
  resolvedAt: string | null
  reporter: Person
  owner: Person & { standing: Standing; suspendedUntil: string | null }
  moderator: { id: string; name: string } | null
  content: {
    text: string | null
    media: Media[]
    createdAt: string | null
    hidden: boolean
    deleted: boolean
    postId: string | null
  }
}

export interface ReportDetail extends ReportItem {
  ownerProfile: {
    createdAt: string
    status: string
    bio: string | null
    deleted: boolean
    reportsAgainst: number
    reportsSubmitted: number
    enforcementActions: number
    warnings: number
  }
  reporterProfile: { createdAt: string; reportsAgainst: number; reportsSubmitted: number }
  engagement: { likes: number | null; comments: number | null; reports: number | null }
  related: {
    id: string
    reason: string
    status: ReportStatus
    createdAt: string
    reporterUsername: string
  }[]
}

export interface ReportQuery {
  page: number
  limit: number
  search?: string
  status?: ReportStatus | ''
  reason?: string
  entityType?: ReportEntityType | ''
  from?: string
  to?: string
  moderatorId?: string
  sort?: 'newest' | 'oldest' | 'severity'
}

export interface ResolveInput {
  id: string
  decision: Decision
  accountAction?: AccountAction
  durationDays?: number | null
  warningTemplate?: string
  notes?: string
  notify: boolean
}

// ---- Mapping ---------------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
const status = (value: string): ReportStatus =>
  value === 'under_review' ? 'under-review' : (value as ReportStatus)
const toStatusParam = (value: ReportStatus) => (value === 'under-review' ? 'under_review' : value)

export const toPerson = (row: any): Person => ({
  id: row?.id ?? '',
  username: row?.username ?? null,
  displayName: row?.display_name ?? null,
  avatar: row?.avatar ?? null,
})

export const toMedia = (list: any): Media[] =>
  Array.isArray(list)
    ? list.map((item) => ({ url: item.url, type: item.type, thumbnailUrl: item.thumbnail_url }))
    : []

export function toReport(row: any): ReportItem {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    reason: row.reason_label ?? row.reason,
    reasonCode: row.reason_code,
    severity: Number(row.severity ?? 1),
    details: row.details,
    status: status(row.status),
    decision: row.decision,
    accountAction: row.account_action,
    notes: row.resolution_notes,
    createdAt: row.created_at,
    reviewStartedAt: row.review_started_at,
    resolvedAt: row.resolved_at,
    reporter: toPerson(row.reporter),
    owner: {
      ...toPerson(row.owner),
      standing: row.owner?.moderation_status ?? 'active',
      suspendedUntil: row.owner?.suspended_until ?? null,
    },
    moderator: row.moderator,
    content: {
      text: row.content?.text ?? null,
      media: toMedia(row.content?.media),
      createdAt: row.content?.created_at ?? null,
      hidden: !!row.content?.hidden,
      deleted: !!row.content?.deleted,
      postId: row.content?.post_id ?? (row.entity_type === 'post' ? row.entity_id : null),
    },
  }
}

function toDetail(row: any): ReportDetail {
  return {
    ...toReport(row),
    ownerProfile: {
      createdAt: row.owner_profile.created_at,
      status: row.owner_profile.status,
      bio: row.owner_profile.bio,
      deleted: row.owner_profile.deleted,
      reportsAgainst: row.owner_profile.reports_against,
      reportsSubmitted: row.owner_profile.reports_submitted,
      enforcementActions: row.owner_profile.enforcement_actions,
      warnings: row.owner_profile.warnings,
    },
    reporterProfile: {
      createdAt: row.reporter_profile.created_at,
      reportsAgainst: row.reporter_profile.reports_against,
      reportsSubmitted: row.reporter_profile.reports_submitted,
    },
    engagement: row.engagement,
    related: row.related_reports.map((item: any) => ({
      id: item.id,
      reason: item.reason_label,
      status: status(item.status),
      createdAt: item.created_at,
      reporterUsername: item.reporter_username,
    })),
  }
}

export function reportParams(query: Partial<ReportQuery>) {
  const params: Record<string, string> = {}
  if (query.page) params.page = String(query.page)
  if (query.limit) params.limit = String(query.limit)
  if (query.search?.trim()) params.search = query.search.trim()
  if (query.status) params.status = toStatusParam(query.status)
  if (query.reason) params.reason = query.reason
  if (query.entityType) params.entity_type = query.entityType
  if (query.from) params.from = query.from
  if (query.to) params.to = query.to
  if (query.moderatorId) params.moderator_id = query.moderatorId
  if (query.sort) params.sort = query.sort
  return params
}

// ---- Endpoints -------------------------------------------------------------------------------

const M = `${BACKOFFICE}/moderation`

export const moderationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getModerationSummary: build.query<
      { pending: number; underReview: number; resolved: number; actionsTaken: number },
      void
    >({
      query: () => `${M}/summary`,
      transformResponse: (data: any) => ({
        pending: data.pending,
        underReview: data.under_review,
        resolved: data.resolved,
        actionsTaken: data.actions_taken,
      }),
      providesTags: ['Report'],
    }),
    getReportReasons: build.query<{ code: string; label: string; severity: number }[], void>({
      query: () => `${M}/reasons`,
      transformResponse: (data: { reasons: { code: string; label: string; severity: number }[] }) =>
        data.reasons,
    }),
    getModerators: build.query<{ id: string; name: string }[], void>({
      query: () => `${M}/moderators`,
      transformResponse: (data: { moderators: { id: string; name: string }[] }) => data.moderators,
      providesTags: ['Report'],
    }),
    getReports: build.query<Page<ReportItem>, ReportQuery>({
      query: (query) => ({ url: `${M}/reports`, params: reportParams(query) }),
      transformResponse: (data: Record<string, unknown>) => toPage(data, 'reports', toReport),
      providesTags: ['Report'],
    }),
    getReport: build.query<ReportDetail, string>({
      query: (id) => `${M}/reports/${encodeURIComponent(id)}`,
      transformResponse: toDetail,
      providesTags: ['Report'],
    }),
    getUserReports: build.query<
      Page<ReportItem>,
      { userId: string; role: 'reporter' | 'owner'; page?: number; limit?: number }
    >({
      query: ({ userId, role, page = 1, limit = 50 }) => ({
        url: `${M}/users/${encodeURIComponent(userId)}/reports`,
        params: { role, page, limit },
      }),
      transformResponse: (data: Record<string, unknown>) => toPage(data, 'reports', toReport),
      providesTags: ['Report'],
    }),
    startReview: build.mutation<ReportDetail, string>({
      query: (id) => ({ url: `${M}/reports/${encodeURIComponent(id)}/review`, method: 'POST' }),
      transformResponse: toDetail,
      invalidatesTags: ['Report', 'Audit'],
    }),
    resolveReport: build.mutation<ReportDetail, ResolveInput>({
      query: ({ id, decision, accountAction, durationDays, warningTemplate, notes, notify }) => ({
        url: `${M}/reports/${encodeURIComponent(id)}/resolve`,
        method: 'POST',
        body: {
          decision,
          ...(decision === 'account_action' ? { account_action: accountAction } : {}),
          ...(accountAction === 'suspend' ? { duration_days: durationDays ?? null } : {}),
          ...(accountAction === 'warning' && warningTemplate
            ? { warning_template: warningTemplate }
            : {}),
          notes: notes?.trim() || undefined,
          notify,
        },
      }),
      transformResponse: toDetail,
      invalidatesTags: ['Report', 'AppUser', 'Hidden', 'Audit'],
    }),
  }),
})

export const {
  useGetModerationSummaryQuery,
  useGetReportReasonsQuery,
  useGetModeratorsQuery,
  useGetReportsQuery,
  useGetReportQuery,
  useGetUserReportsQuery,
  useStartReviewMutation,
  useResolveReportMutation,
} = moderationApi
