import { baseApi, toPage, type Page } from '@/lib/api/base-api'
import { BACKOFFICE } from '@/features/auth/auth-api'

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AuditEntry {
  id: string
  action: string
  actionLabel: string
  actor: { id: string; name: string } | null
  target: { type: string; reference: string; name: string | null } | null
  reason: string | null
  ip: string | null
  createdAt: string
}

export interface AuditQuery {
  page: number
  search?: string
  action?: string
  actorId?: string
  category?: 'moderation' | 'admin' | 'views' | ''
  from?: string
}

export interface AuditFilters {
  actions: { value: string; label: string }[]
  actors: { id: string; name: string }[]
}

const toEntry = (row: any): AuditEntry => ({
  id: row.id,
  action: row.action,
  actionLabel: row.action_label,
  actor: row.actor,
  target: row.target,
  reason: typeof row.reason === 'string' ? row.reason : null,
  ip: row.ip,
  createdAt: row.created_at,
})

export function auditParams(query: Omit<AuditQuery, 'page'> & { page?: number }) {
  const params: Record<string, string> = {}
  if (query.page) params.page = String(query.page)
  if (query.search?.trim()) params.search = query.search.trim().replace(/^@/, '')
  if (query.action) params.action = query.action
  if (query.actorId) params.actor_id = query.actorId
  if (query.category) params.category = query.category
  if (query.from) params.from = query.from
  return params
}

export const auditApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAuditLog: build.query<Page<AuditEntry>, AuditQuery>({
      query: (query) => ({
        url: `${BACKOFFICE}/audit-logs`,
        params: { ...auditParams(query), limit: '10' },
      }),
      transformResponse: (data: Record<string, unknown>) => toPage(data, 'entries', toEntry),
      providesTags: ['Audit'],
    }),
    getAuditFilters: build.query<AuditFilters, void>({
      query: () => `${BACKOFFICE}/audit-logs/filters`,
      providesTags: ['Audit'],
    }),
  }),
})

export const { useGetAuditLogQuery, useGetAuditFiltersQuery } = auditApi
