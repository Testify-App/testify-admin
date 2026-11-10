import { baseApi, toPage, type Page } from '@/lib/api/base-api'
import { BACKOFFICE } from '@/features/auth/auth-api'
import { toMedia, toPerson, type Media, type Person } from '@/features/moderation/moderation-api'

/* eslint-disable @typescript-eslint/no-explicit-any */

export type HiddenType = 'post' | 'comment'
export interface HiddenItem {
  type: HiddenType
  id: string
  postId: string
  content: string | null
  media: Media[]
  postedAt: string
  hiddenAt: string
  hiddenReason: string | null
  reportId: string | null
  author: Person
  hiddenBy: { id: string; name: string } | null
  parentPostContent: string | null
}

export type HiddenPage = Page<HiddenItem> & { counts: { posts: number; comments: number } }

const toHidden = (row: any): HiddenItem => ({
  type: row.type,
  id: row.id,
  postId: row.post_id,
  content: row.content,
  media: toMedia(row.media),
  postedAt: row.posted_at,
  hiddenAt: row.hidden_at,
  hiddenReason: row.hidden_reason,
  reportId: row.report_id,
  author: toPerson(row.author),
  hiddenBy: row.hidden_by,
  parentPostContent: row.parent_post_content,
})

export const hiddenApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getHiddenContent: build.query<HiddenPage, { type: HiddenType; page: number; search?: string }>({
      query: ({ type, page, search }) => ({
        url: `${BACKOFFICE}/hidden-content`,
        params: { type, page, limit: 10, ...(search?.trim() ? { search: search.trim() } : {}) },
      }),
      transformResponse: (data: any) => ({
        ...toPage(data, 'items', toHidden),
        counts: data.counts,
      }),
      providesTags: ['Hidden'],
    }),
    restoreContent: build.mutation<void, { type: HiddenType; id: string; note?: string }>({
      query: ({ type, id, note }) => ({
        url: `${BACKOFFICE}/hidden-content/${type}/${encodeURIComponent(id)}/restore`,
        method: 'POST',
        body: note?.trim() ? { note: note.trim() } : {},
      }),
      invalidatesTags: ['Hidden', 'Report', 'AppUser', 'Audit'],
    }),
  }),
})

export const { useGetHiddenContentQuery, useRestoreContentMutation } = hiddenApi
