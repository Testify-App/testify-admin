import { baseApi, toPage, type Page } from '@/lib/api/base-api'
import { BACKOFFICE } from '@/features/auth/auth-api'
import { toMedia, type Media, type Standing } from '@/features/moderation/moderation-api'

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AppUser {
  id: string
  username: string | null
  displayName: string | null
  name: string
  email: string | null
  avatar: string | null
  status: string
  standing: Standing
  suspendedUntil: string | null
  createdAt: string
  lastLogin: string | null
  reportsAgainst: number
  restriction: {
    type: Standing
    reason: string | null
    reasonCode: string | null
    startedAt: string | null
    durationDays: number | null
    lastActionAt: string | null
  } | null
}

export interface AppUserProfile extends Omit<AppUser, 'reportsAgainst' | 'restriction'> {
  phone: string | null
  bio: string | null
  activatedAt: string | null
  stats: {
    posts: number
    hiddenPosts: number
    comments: number
    hiddenComments: number
    likesGiven: number
    likesReceived: number
    tribeFollowing: number
    tribeFollowers: number
    circle: number
    communities: number
    reportsAgainst: number
    reportsSubmitted: number
    warnings: number
    enforcementActions: number
    notes: number
  }
}

export interface FlaggedItem {
  entityType: 'post' | 'comment'
  entityId: string
  postId: string
  content: string | null
  media: Media[]
  postedAt: string | null
  reportCount: number
  reasons: string[]
  severity: number
  firstReportedAt: string
  lastReportedAt: string
  hasOpenReports: boolean
  hidden: boolean
  deletedByAuthor: boolean
}

export type HistoryKind = 'suspend' | 'ban' | 'reinstate' | 'extend' | 'expire' | 'warning'
export interface HistoryEntry {
  id: string
  kind: HistoryKind
  reason: string | null
  note: string | null
  durationDays: number | null
  endsAt: string | null
  acknowledgedAt: string | null
  createdAt: string
  performedBy: { id: string; name: string } | null
}

export type NoteTag = 'warning' | 'positive' | 'neutral' | 'pending_review'
export interface Note {
  id: string
  body: string
  tag: NoteTag | null
  createdAt: string
  updatedAt: string | null
  author: { id: string; name: string } | null
}

export interface WarningTemplate {
  key: string
  label: string
  message: string
}

export interface UserQuery {
  page: number
  limit: number
  search?: string
  status?: Standing | 'restricted' | ''
  flagged?: boolean
  joinedFrom?: string
  joinedTo?: string
  sort?: string
}

const fullName = (row: any) =>
  `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() ||
  row.display_name ||
  row.username ||
  'Unnamed user'

const toUser = (row: any): AppUser => ({
  id: row.id,
  username: row.username,
  displayName: row.display_name,
  name: fullName(row),
  email: row.email,
  avatar: row.avatar,
  status: row.status,
  standing: row.moderation_status,
  suspendedUntil: row.suspended_until,
  createdAt: row.created_at,
  lastLogin: row.last_login,
  reportsAgainst: row.reports_against ?? 0,
  restriction: row.restriction
    ? {
        type: row.restriction.type,
        reason: row.restriction.reason,
        reasonCode: row.restriction.reason_code,
        startedAt: row.restriction.started_at,
        durationDays: row.restriction.duration_days,
        lastActionAt: row.restriction.last_action_at,
      }
    : null,
})

const toProfile = (row: any): AppUserProfile => ({
  id: row.id,
  username: row.username,
  displayName: row.display_name,
  name: fullName(row),
  email: row.email,
  avatar: row.avatar,
  status: row.status,
  standing: row.moderation_status,
  suspendedUntil: row.suspended_until,
  createdAt: row.created_at,
  lastLogin: row.last_login,
  phone: row.phone_number,
  bio: row.bio,
  activatedAt: row.activated_at,
  stats: {
    posts: row.stats.posts,
    hiddenPosts: row.stats.hidden_posts,
    comments: row.stats.comments,
    hiddenComments: row.stats.hidden_comments,
    likesGiven: row.stats.likes_given,
    likesReceived: row.stats.likes_received,
    tribeFollowing: row.stats.tribe_following,
    tribeFollowers: row.stats.tribe_followers,
    circle: row.stats.circle,
    communities: row.stats.communities,
    reportsAgainst: row.stats.reports_against,
    reportsSubmitted: row.stats.reports_submitted,
    warnings: row.stats.warnings,
    enforcementActions: row.stats.enforcement_actions,
    notes: row.stats.notes,
  },
})

const toFlagged = (row: any): FlaggedItem => ({
  entityType: row.entity_type,
  entityId: row.entity_id,
  postId: row.post_id,
  content: row.content,
  media: toMedia(row.media),
  postedAt: row.posted_at,
  reportCount: row.report_count,
  reasons: row.reasons ?? [],
  severity: row.severity,
  firstReportedAt: row.first_reported_at,
  lastReportedAt: row.last_reported_at,
  hasOpenReports: row.has_open_reports,
  hidden: row.hidden,
  deletedByAuthor: row.deleted_by_author,
})

const toHistory = (row: any): HistoryEntry => ({
  id: row.id,
  kind: row.kind,
  reason: row.reason,
  note: row.note ?? null,
  durationDays: row.duration_days ?? null,
  endsAt: row.ends_at ?? null,
  acknowledgedAt: row.acknowledged_at ?? null,
  createdAt: row.created_at,
  performedBy: row.performed_by,
})

const toNote = (row: any): Note => ({
  id: row.id,
  body: row.body,
  tag: row.tag,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  author: row.author,
})

function userParams(query: UserQuery) {
  const params: Record<string, string> = { page: String(query.page), limit: String(query.limit) }
  if (query.search?.trim()) params.search = query.search.trim().replace(/^@/, '')
  if (query.status) params.status = query.status
  if (query.flagged) params.flagged = 'true'
  if (query.joinedFrom) params.joined_from = query.joinedFrom
  if (query.joinedTo) params.joined_to = query.joinedTo
  if (query.sort) params.sort = query.sort
  return params
}

const U = `${BACKOFFICE}/users`
const user = (id: string) => `${U}/${encodeURIComponent(id)}`

export interface StandingInput {
  userId: string
  durationDays?: number | null
  reasonCode?: string
  reason?: string
  note?: string
  notify: boolean
}
const standingBody = ({ durationDays, reasonCode, reason, note, notify }: StandingInput) => ({
  ...(durationDays !== undefined ? { duration_days: durationDays } : {}),
  reason_code: reasonCode || undefined,
  reason: reason?.trim() || undefined,
  note: note?.trim() || undefined,
  notify,
})
// A standing change touches the user, their history, reports and the audit log.
const standingTags = ['AppUser', 'Report', 'Audit'] as const

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAppUsers: build.query<Page<AppUser>, UserQuery>({
      query: (query) => ({ url: U, params: userParams(query) }),
      transformResponse: (data: Record<string, unknown>) => toPage(data, 'users', toUser),
      providesTags: ['AppUser'],
    }),
    getAppUser: build.query<AppUserProfile, string>({
      query: (id) => user(id),
      transformResponse: toProfile,
      providesTags: ['AppUser'],
    }),
    getFlaggedContent: build.query<
      Page<FlaggedItem>,
      { userId: string; sort: string; page: number }
    >({
      query: ({ userId, sort, page }) => ({
        url: `${user(userId)}/flagged-content`,
        params: { sort, page, limit: 10 },
      }),
      transformResponse: (data: Record<string, unknown>) => toPage(data, 'items', toFlagged),
      providesTags: ['AppUser', 'Report', 'Hidden'],
    }),
    getModerationHistory: build.query<HistoryEntry[], string>({
      query: (id) => `${user(id)}/moderation-history`,
      transformResponse: (data: { history: any[] }) => data.history.map(toHistory),
      providesTags: ['AppUser'],
    }),
    suspendUser: build.mutation<void, StandingInput>({
      query: (input) => ({
        url: `${user(input.userId)}/suspend`,
        method: 'POST',
        body: standingBody(input),
      }),
      invalidatesTags: [...standingTags],
    }),
    changeSuspension: build.mutation<void, StandingInput>({
      query: (input) => ({
        url: `${user(input.userId)}/suspension`,
        method: 'PATCH',
        body: standingBody(input),
      }),
      invalidatesTags: [...standingTags],
    }),
    banUser: build.mutation<void, StandingInput>({
      query: (input) => ({
        url: `${user(input.userId)}/ban`,
        method: 'POST',
        body: standingBody({ ...input, durationDays: undefined }),
      }),
      invalidatesTags: [...standingTags],
    }),
    reinstateUser: build.mutation<void, StandingInput>({
      query: (input) => ({
        url: `${user(input.userId)}/reinstate`,
        method: 'POST',
        body: standingBody({ ...input, durationDays: undefined }),
      }),
      invalidatesTags: [...standingTags],
    }),
    getNotes: build.query<Note[], string>({
      query: (id) => `${user(id)}/notes`,
      transformResponse: (data: { notes: any[] }) => data.notes.map(toNote),
      providesTags: ['AppUser'],
    }),
    addNote: build.mutation<void, { userId: string; body: string; tag: NoteTag | null }>({
      query: ({ userId, body, tag }) => ({
        url: `${user(userId)}/notes`,
        method: 'POST',
        body: { body: body.trim(), tag },
      }),
      invalidatesTags: ['AppUser', 'Audit'],
    }),
    updateNote: build.mutation<
      void,
      { userId: string; noteId: string; body: string; tag: NoteTag | null }
    >({
      query: ({ userId, noteId, body, tag }) => ({
        url: `${user(userId)}/notes/${noteId}`,
        method: 'PATCH',
        body: { body: body.trim(), tag },
      }),
      invalidatesTags: ['AppUser', 'Audit'],
    }),
    deleteNote: build.mutation<void, { userId: string; noteId: string }>({
      query: ({ userId, noteId }) => ({ url: `${user(userId)}/notes/${noteId}`, method: 'DELETE' }),
      invalidatesTags: ['AppUser', 'Audit'],
    }),
    getWarningTemplates: build.query<WarningTemplate[], void>({
      query: () => `${U}/warning-templates`,
      transformResponse: (data: { templates: WarningTemplate[] }) => data.templates,
    }),
    sendWarning: build.mutation<
      void,
      { userId: string; templateKey?: string; message?: string; sendEmail: boolean }
    >({
      query: ({ userId, templateKey, message, sendEmail }) => ({
        url: `${user(userId)}/warnings`,
        method: 'POST',
        body: {
          template_key: templateKey || undefined,
          message: message?.trim() || undefined,
          send_email: sendEmail,
        },
      }),
      invalidatesTags: ['AppUser', 'Audit'],
    }),
  }),
})

export const {
  useGetAppUsersQuery,
  useGetAppUserQuery,
  useGetFlaggedContentQuery,
  useGetModerationHistoryQuery,
  useSuspendUserMutation,
  useChangeSuspensionMutation,
  useBanUserMutation,
  useReinstateUserMutation,
  useGetNotesQuery,
  useAddNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useGetWarningTemplatesQuery,
  useSendWarningMutation,
} = usersApi
