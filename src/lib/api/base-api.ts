import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { toast } from 'sonner'
import { signedOut } from '@/app/session-slice'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081/api/v1'

/** Normalised error for every request; the backend may use `code` or `statusCode`. */
export interface ApiError {
  status: number | 'NETWORK'
  message: string
}

/** Paginated list as returned by the backend (`{ <key>: [], total, currentPage, totalPages }`). */
export interface Page<T> {
  items: T[]
  total: number
  currentPage: number
  totalPages: number
}

export function toPage<T, Row>(
  data: Record<string, unknown>,
  key: string,
  map: (row: Row) => T,
): Page<T> {
  return {
    items: ((data[key] as Row[] | undefined) ?? []).map(map),
    total: Number(data.total ?? 0),
    currentPage: Number(data.currentPage ?? 1),
    totalPages: Number(data.totalPages ?? 0),
  }
}

type SessionState = { auth: { session: { token: string } | null } }

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as SessionState).auth.session?.token
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

function toApiError(error: FetchBaseQueryError): ApiError {
  if (typeof error.status !== 'number')
    return {
      status: 'NETWORK',
      message: 'Unable to reach the server. Check your connection and try again.',
    }
  const body = error.data
  const message =
    body && typeof body === 'object' && typeof (body as { message?: unknown }).message === 'string'
      ? (body as { message: string }).message
      : typeof body === 'string' && body.trim()
        ? body
        : 'Something went wrong. Please try again.'
  return { status: error.status, message }
}

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, ApiError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.error) {
    const error = toApiError(result.error)
    // A 401 on a signed-in session ends it everywhere.
    if (error.status === 401 && (api.getState() as SessionState).auth.session) {
      api.dispatch(signedOut())
      api.dispatch(baseApi.util.resetApiState())
      toast.error('Your session has ended. Please sign in again.')
    }
    return { error, meta: result.meta }
  }
  // Successful responses are wrapped as `{ status, message, code, data }`.
  const body = result.data
  const data = body && typeof body === 'object' && 'data' in body ? body.data : body
  return { data, meta: result.meta }
}

// Feature modules add endpoints with `baseApi.injectEndpoints` and declare their tag types here.
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Profile', 'Role', 'Staff', 'Permission', 'Report', 'AppUser', 'Hidden', 'Audit'],
  endpoints: () => ({}),
})

/** Readable message for anything thrown by `.unwrap()` or caught in a handler. */
export function errorMessage(cause: unknown, fallback = 'Something went wrong. Please try again.') {
  if (cause && typeof cause === 'object' && 'message' in cause) {
    const message = (cause as { message: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}
