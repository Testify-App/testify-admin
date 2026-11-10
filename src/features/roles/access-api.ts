import { baseApi, toPage, type Page } from '@/lib/api/base-api'
import { BACKOFFICE } from '@/features/auth/auth-api'
import type { Role, StaffActivity, StaffMember, StaffStatus } from './model'

// ---- Server shapes ---------------------------------------------------------------------------

interface RoleRow {
  id: string
  role: string
  description: string
  is_active: boolean
  is_system: boolean
  admin_count?: number
  permission_count?: number
  permissions?: { id: string }[]
  created_at: string
  created_by: { id: string; name: string } | null
}

type StaffStatusRow = 'active' | 'suspended' | 'pending_invitation'
interface StaffRow {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone_number: string | null
  staff_status: StaffStatusRow
  role_id: string | null
  role: string | null
  is_root_account: boolean
  last_login: string | null
  created_at: string
}

interface ActivityRow {
  id: string
  action: string
  target_name: string | null
  actor: { id: string; name: string } | null
  before_summary: Record<string, unknown> | null
  after_summary: Record<string, unknown> | null
  created_at: string
}

/** One invitee, as sent to the invite endpoints. */
export interface StaffInvitation {
  firstName: string
  lastName: string
  email: string
  phone: string
  roleId: string
}

export type InviteRowStatus = 'valid' | 'invalid' | 'invited' | 'failed'
export interface InviteRowResult {
  firstName: string
  lastName: string
  email: string
  phone: string
  roleId: string
  roleName: string
  status: InviteRowStatus
  reason: string
}
interface InviteRowResultRow {
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  role_id?: string
  role?: string
  status: InviteRowStatus
  reason?: string
}

export interface StaffSummary {
  total: number
  active: number
  inactive: number
  pending: number
}

export interface StaffQuery {
  page: number
  limit: number
  search?: string
  status?: StaffStatus | ''
  roleId?: string
  from?: string
  to?: string
  sort?: 'newest' | 'name_asc' | 'name_desc'
}

// ---- Mapping ---------------------------------------------------------------------------------

const toStatusRow: Record<StaffStatus, StaffStatusRow> = {
  Active: 'active',
  Inactive: 'suspended',
  Pending: 'pending_invitation',
}
const fromStatusRow: Record<StaffStatusRow, StaffStatus> = {
  active: 'Active',
  suspended: 'Inactive',
  pending_invitation: 'Pending',
}

export function toRole(row: RoleRow): Role {
  return {
    id: row.id,
    name: row.role,
    description: row.description,
    permissionIds: row.permissions?.map((permission) => permission.id) ?? [],
    permissionCount: row.permissions?.length ?? Number(row.permission_count ?? 0),
    adminCount: Number(row.admin_count ?? 0),
    status: row.is_active ? 'Active' : 'Inactive',
    createdAt: row.created_at,
    createdBy: row.created_by?.name ?? null,
    builtIn: row.is_system,
  }
}

export function toStaff(row: StaffRow): StaffMember {
  return {
    id: row.id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    email: row.email,
    phone: row.phone_number ?? '',
    roleId: row.role_id,
    roleName: row.role,
    status: fromStatusRow[row.staff_status] ?? 'Pending',
    createdAt: row.created_at,
    lastLogin: row.last_login,
    isRoot: row.is_root_account,
  }
}

/** Human-readable line for an audit-log entry about a staff member. */
export function describeActivity(row: ActivityRow): StaffActivity {
  const actor = row.actor?.name || 'An administrator'
  const target = row.target_name || 'this staff member'
  const after = row.after_summary ?? {}
  const text = (() => {
    switch (row.action) {
      case 'staff:invite':
      case 'staff:bulk_invite':
        return `${actor} invited ${target}`
      case 'staff:resend_invite':
        return `${actor} resent the invitation to ${target}`
      case 'staff:accept_invite':
        return `${target} accepted the invitation`
      case 'admin:update':
        return `${actor} updated the details of ${target}`
      case 'admin:suspend':
        return `${actor} suspended ${target}`
      case 'admin:reactivate':
        return `${actor} reactivated ${target}`
      case 'admin:reassign_role':
        return `${actor} changed the role of ${target}${after.role ? ` to ${after.role}` : ''}`
      case 'auth:login':
        return `${target} signed in`
      case 'auth:logout':
        return `${target} signed out`
      case 'auth:password_changed':
        return `${target} changed their password`
      case 'auth:password_reset':
        return `${target} reset their password`
      case 'profile:update':
        return `${target} updated their profile`
      default:
        return `${actor}: ${row.action}`
    }
  })()
  const reason = row.action === 'admin:suspend' ? after.reason : undefined
  return {
    id: row.id,
    text,
    detail: typeof reason === 'string' && reason ? reason : undefined,
    createdAt: row.created_at,
  }
}

const toInvitee = (invite: StaffInvitation) => ({
  first_name: invite.firstName.trim(),
  last_name: invite.lastName.trim(),
  email: invite.email.trim(),
  phone_number: invite.phone.trim() || undefined,
  role_id: invite.roleId,
})

const toInviteResult = (row: InviteRowResultRow): InviteRowResult => ({
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phone: row.phone_number ?? '',
  roleId: row.role_id ?? '',
  roleName: row.role ?? '',
  status: row.status,
  reason: row.status === 'valid' || row.status === 'invited' ? '' : (row.reason ?? ''),
})

function staffParams(query: StaffQuery) {
  const params: Record<string, string> = { page: String(query.page), limit: String(query.limit) }
  if (query.search?.trim()) params.search = query.search.trim()
  if (query.status) params.status = toStatusRow[query.status]
  if (query.roleId) params.role_id = query.roleId
  if (query.from) params.from = query.from
  if (query.to) params.to = query.to
  if (query.sort) params.sort = query.sort
  return params
}

/** Every role fits on one page; the catalogue is small. */
const ROLE_PAGE_SIZE = 100
/** Upper bound for "export everything that matches". */
export const EXPORT_LIMIT = 10000

// Every write can change role counts, staff rows and activity, so mutations refresh both.
const invalidatesAccess = ['Role', 'Staff'] as const

// ---- Endpoints -------------------------------------------------------------------------------

export const accessApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRoles: build.query<Role[], void>({
      query: () => ({ url: `${BACKOFFICE}/roles`, params: { limit: ROLE_PAGE_SIZE } }),
      transformResponse: (data: { roles: RoleRow[] }) => data.roles.map(toRole),
      providesTags: ['Role'],
    }),
    getRole: build.query<Role, string>({
      query: (id) => `${BACKOFFICE}/roles/${encodeURIComponent(id)}`,
      transformResponse: toRole,
      providesTags: ['Role'],
    }),
    createRole: build.mutation<
      Role,
      { name: string; description: string; permissionIds: string[] }
    >({
      query: ({ name, description, permissionIds }) => ({
        url: `${BACKOFFICE}/roles`,
        method: 'POST',
        body: {
          role_name: name.trim(),
          description: description.trim(),
          permission_ids: permissionIds,
        },
      }),
      transformResponse: toRole,
      invalidatesTags: [...invalidatesAccess],
    }),
    updateRole: build.mutation<
      Role,
      { id: string; name: string; description: string; permissionIds: string[] }
    >({
      query: ({ id, name, description, permissionIds }) => ({
        url: `${BACKOFFICE}/roles/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: {
          role_name: name.trim(),
          description: description.trim(),
          permission_ids: permissionIds,
        },
      }),
      transformResponse: toRole,
      invalidatesTags: [...invalidatesAccess, 'Profile'],
    }),
    setRoleActive: build.mutation<Role, { id: string; active: boolean }>({
      query: ({ id, active }) => ({
        url: `${BACKOFFICE}/roles/${active ? 'activate' : 'deactivate'}/${encodeURIComponent(id)}`,
        method: 'PATCH',
      }),
      transformResponse: toRole,
      invalidatesTags: [...invalidatesAccess],
    }),
    deleteRole: build.mutation<void, string>({
      query: (id) => ({ url: `${BACKOFFICE}/roles/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: [...invalidatesAccess],
    }),
    reassignRole: build.mutation<StaffMember, { staffId: string; roleId: string }>({
      query: ({ staffId, roleId }) => ({
        url: `${BACKOFFICE}/roles/reassign`,
        method: 'PATCH',
        body: { admin_id: staffId, role_id: roleId },
      }),
      transformResponse: toStaff,
      invalidatesTags: [...invalidatesAccess],
    }),

    getStaff: build.query<Page<StaffMember>, StaffQuery>({
      query: (query) => ({ url: `${BACKOFFICE}/staff`, params: staffParams(query) }),
      transformResponse: (data: Record<string, unknown>) => toPage(data, 'staff', toStaff),
      providesTags: ['Staff'],
    }),
    getStaffSummary: build.query<StaffSummary, void>({
      query: () => `${BACKOFFICE}/staff/summary`,
      transformResponse: (data: {
        total: number
        active: number
        suspended: number
        pending_invitation: number
      }) => ({
        total: data.total,
        active: data.active,
        inactive: data.suspended,
        pending: data.pending_invitation,
      }),
      providesTags: ['Staff'],
    }),
    getStaffMember: build.query<StaffMember, string>({
      query: (id) => `${BACKOFFICE}/staff/${encodeURIComponent(id)}`,
      transformResponse: toStaff,
      providesTags: ['Staff'],
    }),
    getStaffActivity: build.query<Page<StaffActivity>, { id: string; limit: number }>({
      query: ({ id, limit }) => ({
        url: `${BACKOFFICE}/staff/${encodeURIComponent(id)}/activity`,
        params: { page: 1, limit },
      }),
      transformResponse: (data: Record<string, unknown>) =>
        toPage(data, 'activities', describeActivity),
      providesTags: ['Staff'],
    }),
    updateStaff: build.mutation<
      StaffMember,
      { id: string; firstName: string; lastName: string; phone: string; roleId: string }
    >({
      query: ({ id, firstName, lastName, phone, roleId }) => ({
        url: `${BACKOFFICE}/staff/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phone.trim(),
          role_id: roleId,
        },
      }),
      transformResponse: toStaff,
      invalidatesTags: [...invalidatesAccess, 'Profile'],
    }),
    suspendStaff: build.mutation<StaffMember, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `${BACKOFFICE}/staff/suspend/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: { reason: reason.trim() },
      }),
      transformResponse: toStaff,
      invalidatesTags: [...invalidatesAccess],
    }),
    reactivateStaff: build.mutation<StaffMember, string>({
      query: (id) => ({
        url: `${BACKOFFICE}/staff/reactivate/${encodeURIComponent(id)}`,
        method: 'PATCH',
      }),
      transformResponse: toStaff,
      invalidatesTags: [...invalidatesAccess],
    }),
    resendInvite: build.mutation<StaffMember, string>({
      query: (id) => ({
        url: `${BACKOFFICE}/staff/invite/resend/${encodeURIComponent(id)}`,
        method: 'POST',
      }),
      transformResponse: toStaff,
      invalidatesTags: ['Staff'],
    }),
    inviteStaff: build.mutation<StaffMember, StaffInvitation>({
      query: (invite) => ({
        url: `${BACKOFFICE}/staff/invite`,
        method: 'POST',
        body: toInvitee(invite),
      }),
      transformResponse: toStaff,
      invalidatesTags: [...invalidatesAccess],
    }),
    previewInvites: build.mutation<InviteRowResult[], StaffInvitation[]>({
      query: (invites) => ({
        url: `${BACKOFFICE}/staff/invite/bulk/preview`,
        method: 'POST',
        body: { invitees: invites.map(toInvitee) },
      }),
      transformResponse: (data: { rows: InviteRowResultRow[] }) => data.rows.map(toInviteResult),
    }),
    bulkInvite: build.mutation<InviteRowResult[], StaffInvitation[]>({
      query: (invites) => ({
        url: `${BACKOFFICE}/staff/invite/bulk`,
        method: 'POST',
        body: { invitees: invites.map(toInvitee) },
      }),
      transformResponse: (data: { rows: InviteRowResultRow[] }) => data.rows.map(toInviteResult),
      invalidatesTags: [...invalidatesAccess],
    }),
  }),
})

export const {
  useGetRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useSetRoleActiveMutation,
  useDeleteRoleMutation,
  useReassignRoleMutation,
  useGetStaffQuery,
  useLazyGetStaffQuery,
  useGetStaffSummaryQuery,
  useGetStaffMemberQuery,
  useGetStaffActivityQuery,
  useUpdateStaffMutation,
  useSuspendStaffMutation,
  useReactivateStaffMutation,
  useResendInviteMutation,
  useInviteStaffMutation,
  usePreviewInvitesMutation,
  useBulkInviteMutation,
} = accessApi
