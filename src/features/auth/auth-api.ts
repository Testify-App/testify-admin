import { baseApi } from '@/lib/api/base-api'
import type { Session, SessionUser } from '@/app/session-slice'

/** Every admin-portal endpoint lives under `/backoffice`. */
export const BACKOFFICE = '/backoffice'

export interface SignInRequest {
  email: string
  password: string
}

/** Step 1 of sign-in: the code has been emailed to the admin. */
export interface SignInChallenge {
  id: string
  email: string
  firstName: string
}

interface AdminRow {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
}

interface ProfileRow extends AdminRow {
  role: { id: string; name: string; is_active: boolean; is_system: boolean } | null
  permissions: string[]
}

export function adminName(row: Pick<AdminRow, 'first_name' | 'last_name' | 'email'>) {
  return `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || row.email
}

export function toSessionUser(row: ProfileRow): SessionUser {
  return {
    id: row.id,
    name: adminName(row),
    email: row.email,
    role: row.role?.name ?? null,
    permissions: row.permissions,
  }
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    signIn: build.mutation<SignInChallenge, SignInRequest>({
      query: (body) => ({ url: `${BACKOFFICE}/auth/login`, method: 'POST', body }),
      transformResponse: (row: AdminRow) => ({
        id: row.id,
        email: row.email,
        firstName: row.first_name ?? '',
      }),
    }),
    resendSignInCode: build.mutation<void, { id: string }>({
      query: (body) => ({ url: `${BACKOFFICE}/auth/login/resend`, method: 'POST', body }),
    }),
    verifySignInCode: build.mutation<Session, { id: string; otp: string }>({
      query: (body) => ({ url: `${BACKOFFICE}/auth/login/verify`, method: 'POST', body }),
      transformResponse: (row: AdminRow & { jwt_token: string }) => ({
        token: row.jwt_token,
        user: { id: row.id, name: adminName(row), email: row.email },
      }),
    }),
    getProfile: build.query<SessionUser, void>({
      query: () => `${BACKOFFICE}/auth/me`,
      transformResponse: toSessionUser,
      providesTags: ['Profile'],
    }),
    signOut: build.mutation<void, void>({
      query: () => ({ url: `${BACKOFFICE}/auth/logout`, method: 'POST' }),
    }),
    requestPasswordReset: build.mutation<void, { email: string }>({
      query: (body) => ({ url: `${BACKOFFICE}/auth/forgot-password`, method: 'POST', body }),
    }),
    resendPasswordReset: build.mutation<void, { email: string }>({
      query: (body) => ({ url: `${BACKOFFICE}/auth/forgot-password/resend`, method: 'POST', body }),
    }),
    verifyPasswordReset: build.mutation<string, { email: string; otp: string }>({
      query: (body) => ({ url: `${BACKOFFICE}/auth/forgot-password/verify`, method: 'POST', body }),
      transformResponse: (data: { hash_id_key: string }) => data.hash_id_key,
    }),
    resetPassword: build.mutation<
      void,
      { hash_id_key: string; new_password: string; confirm_new_password: string }
    >({
      query: (body) => ({ url: `${BACKOFFICE}/auth/forgot-password/reset`, method: 'PATCH', body }),
    }),
    acceptInvite: build.mutation<
      void,
      { token: string; new_password: string; confirm_new_password: string }
    >({
      query: (body) => ({ url: `${BACKOFFICE}/staff/invite/accept`, method: 'POST', body }),
    }),
  }),
})

export const {
  useSignInMutation,
  useResendSignInCodeMutation,
  useVerifySignInCodeMutation,
  useGetProfileQuery,
  useSignOutMutation,
  useRequestPasswordResetMutation,
  useResendPasswordResetMutation,
  useVerifyPasswordResetMutation,
  useResetPasswordMutation,
  useAcceptInviteMutation,
} = authApi
