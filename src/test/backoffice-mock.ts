import { http, HttpResponse, type JsonBodyType } from 'msw'
import { API_BASE_URL } from '@/lib/api/base-api'
import { allPermissionIds, permissions } from '@/features/roles/model'
import {
  seedRoles,
  seedStaff,
  type FixtureActivity,
  type FixtureRole,
  type FixtureStaff,
} from './fixtures/backoffice-seed'

/**
 * In-memory stand-in for the testify-backend `/backoffice` API. It answers with the same
 * envelopes and enforces the same rules (one role per admin, locked system role, no deleting a
 * role still held, no self-suspension or self role change), so feature tests exercise the real
 * request/response mapping. State resets before every test.
 */
const B = `${API_BASE_URL}/backoffice`
/** The admin signed in by `renderApp` (see render-app.tsx). */
export const ME = { id: 'admin-test', name: 'Test Admin', email: 'admin@example.com' }

interface State {
  roles: FixtureRole[]
  staff: FixtureStaff[]
}
let state: State
let sequence = 0
export function resetBackoffice() {
  state = structuredClone({ roles: seedRoles, staff: seedStaff })
  sequence = 0
}
resetBackoffice()
/** Direct access to the mock database, for assertions. */
export const backoffice = () => state

const ok = (data?: JsonBodyType, status = 200) =>
  HttpResponse.json({ status: 'success', message: 'OK', code: status, data }, { status })
const fail = (status: number, message: string) =>
  HttpResponse.json({ status: 'error', code: status, message }, { status })

const fullName = (staff: FixtureStaff) => `${staff.firstName} ${staff.lastName}`.trim()
const now = () => new Date().toISOString()
const roleById = (id: string | null | undefined) => state.roles.find((role) => role.id === id)

function roleRow(role: FixtureRole, withPermissions = false) {
  return {
    id: role.id,
    role: role.name,
    description: role.description,
    is_active: role.status === 'Active',
    is_system: role.builtIn,
    created_at: role.createdAt,
    created_by: role.createdBy ? { id: 'creator', name: role.createdBy } : null,
    admin_count: state.staff.filter((staff) => staff.roleId === role.id).length,
    permission_count: role.permissionIds.length,
    ...(withPermissions
      ? {
          permissions: permissions
            .filter((permission) => role.permissionIds.includes(permission.id))
            .map((permission) => ({ id: permission.id, category: permission.category })),
        }
      : {}),
  }
}

function staffRow(staff: FixtureStaff) {
  return {
    id: staff.id,
    first_name: staff.firstName,
    last_name: staff.lastName,
    email: staff.email,
    phone_number: staff.phone || null,
    staff_status: staff.status,
    role_id: staff.roleId,
    role: roleById(staff.roleId)?.name ?? null,
    is_root_account: staff.isRoot,
    last_login: staff.lastLogin,
    created_at: staff.createdAt,
  }
}

function log(staff: FixtureStaff, entry: Omit<FixtureActivity, 'id' | 'createdAt' | 'actor'>) {
  staff.activity.unshift({ id: `log-${++sequence}`, actor: ME.name, createdAt: now(), ...entry })
}

function page<T>(items: T[], url: URL, key: string) {
  const pageNumber = Number(url.searchParams.get('page') ?? 1)
  const limit = Number(url.searchParams.get('limit') ?? 10)
  return {
    [key]: items.slice((pageNumber - 1) * limit, pageNumber * limit),
    total: items.length,
    currentPage: pageNumber,
    totalPages: Math.ceil(items.length / limit),
  }
}

const isPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').length
  return /^\+?[\d\s().-]+$/.test(value) && digits >= 7 && digits <= 15
}

type Invitee = {
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  role_id: string
}
function inviteProblem(invitee: Invitee, emailsInBatch?: Set<string>) {
  const email = invitee.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
  if (invitee.phone_number && !isPhone(invitee.phone_number)) return 'Enter a valid phone number.'
  if (emailsInBatch?.has(email)) return 'Email is repeated in this file.'
  emailsInBatch?.add(email)
  if (state.staff.some((staff) => staff.email === email)) return 'Email already exists.'
  if (!roleById(invitee.role_id)) return 'Role not found.'
  return ''
}
function createInvite(invitee: Invitee) {
  const staff: FixtureStaff = {
    id: `staff-${++sequence}`,
    firstName: invitee.first_name.trim(),
    lastName: invitee.last_name.trim(),
    email: invitee.email.trim().toLowerCase(),
    phone: invitee.phone_number?.trim() ?? '',
    roleId: invitee.role_id,
    status: 'pending_invitation',
    createdAt: now(),
    lastLogin: null,
    isRoot: false,
    activity: [],
  }
  log(staff, { action: 'staff:invite' })
  state.staff.unshift(staff)
  return staff
}

type Params = Record<string, string>
const json = async <T>(request: Request) => (await request.json()) as T

export const backofficeHandlers = [
  // ---- auth
  http.get(`${B}/auth/me`, () =>
    ok({
      id: ME.id,
      first_name: 'Test',
      last_name: 'Admin',
      email: ME.email,
      role: { id: 'super-admin', name: 'Super Admin', is_active: true, is_system: true },
      permissions: allPermissionIds,
    }),
  ),
  http.post(`${B}/auth/logout`, () => ok()),

  // ---- roles
  http.get(`${B}/roles`, () => ok({ roles: state.roles.map((role) => roleRow(role)) })),
  http.get<Params>(`${B}/roles/:roleId`, ({ params }) => {
    const role = roleById(params.roleId)
    return role ? ok(roleRow(role, true)) : fail(404, 'Role not found.')
  }),
  http.post(`${B}/roles`, async ({ request }) => {
    const body = await json<{ role_name: string; description: string; permission_ids: string[] }>(
      request,
    )
    if (state.roles.some((role) => role.name.toLowerCase() === body.role_name.toLowerCase()))
      return fail(400, 'Role name already exists.')
    const role: FixtureRole = {
      id: `role-${++sequence}`,
      name: body.role_name,
      description: body.description,
      permissionIds: body.permission_ids,
      status: 'Active',
      createdAt: now(),
      createdBy: ME.name,
      builtIn: false,
    }
    state.roles.push(role)
    return ok(roleRow(role, true), 201)
  }),
  http.patch<Params>(`${B}/roles/:roleId`, async ({ params, request }) => {
    if (params.roleId === 'reassign') {
      const body = await json<{ admin_id: string; role_id: string }>(request)
      const staff = state.staff.find((item) => item.id === body.admin_id)
      const role = roleById(body.role_id)
      if (!staff) return fail(404, 'Admin not found.')
      if (!role) return fail(404, 'Role not found.')
      if (staff.id === ME.id) return fail(403, 'You cannot change your own role.')
      if (staff.roleId !== role.id) {
        staff.roleId = role.id
        log(staff, { action: 'admin:reassign_role', role: role.name })
      }
      return ok(staffRow(staff))
    }
    const role = roleById(params.roleId)
    if (!role) return fail(404, 'Role not found.')
    if (role.builtIn) return fail(400, 'The Super Admin role is managed by the system.')
    const body = await json<{ role_name: string; description: string; permission_ids: string[] }>(
      request,
    )
    if (!body.permission_ids.length) return fail(400, 'Select at least one permission.')
    if (
      state.roles.some(
        (item) => item.id !== role.id && item.name.toLowerCase() === body.role_name.toLowerCase(),
      )
    )
      return fail(400, 'Role name already exists.')
    Object.assign(role, {
      name: body.role_name,
      description: body.description,
      permissionIds: body.permission_ids,
    })
    return ok(roleRow(role, true))
  }),
  http.patch<Params>(`${B}/roles/:action/:roleId`, ({ params }) => {
    const role = roleById(params.roleId)
    if (!role) return fail(404, 'Role not found.')
    if (role.builtIn) return fail(400, 'The Super Admin role is managed by the system.')
    role.status = params.action === 'activate' ? 'Active' : 'Inactive'
    return ok(roleRow(role, true))
  }),
  http.delete<Params>(`${B}/roles/:roleId`, ({ params }) => {
    const role = roleById(params.roleId)
    if (!role) return fail(404, 'Role not found.')
    if (role.builtIn) return fail(400, 'The Super Admin role is managed by the system.')
    if (state.staff.some((staff) => staff.roleId === role.id))
      return fail(400, 'Reassign users before deleting this role.')
    state.roles = state.roles.filter((item) => item !== role)
    return ok()
  }),

  // ---- staff
  http.get(`${B}/staff`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase() ?? ''
    const status = url.searchParams.get('status')
    const roleId = url.searchParams.get('role_id')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const sort = url.searchParams.get('sort')
    let rows = state.staff.filter(
      (staff) =>
        (!search || `${fullName(staff)} ${staff.email}`.toLowerCase().includes(search)) &&
        (!status || staff.status === status) &&
        (!roleId || staff.roleId === roleId) &&
        (!from || staff.createdAt.slice(0, 10) >= from) &&
        (!to || staff.createdAt.slice(0, 10) <= to),
    )
    if (sort === 'name_asc' || sort === 'name_desc')
      rows = [...rows].sort(
        (a, b) => fullName(a).localeCompare(fullName(b)) * (sort === 'name_asc' ? 1 : -1),
      )
    return ok(page(rows.map(staffRow), url, 'staff'))
  }),
  http.get(`${B}/staff/summary`, () =>
    ok({
      total: state.staff.length,
      active: state.staff.filter((staff) => staff.status === 'active').length,
      suspended: state.staff.filter((staff) => staff.status === 'suspended').length,
      pending_invitation: state.staff.filter((staff) => staff.status === 'pending_invitation')
        .length,
    }),
  ),
  http.post(`${B}/staff/invite`, async ({ request }) => {
    const body = await json<Invitee>(request)
    const problem = inviteProblem(body)
    if (problem) return fail(400, problem)
    return ok(staffRow(createInvite(body)), 201)
  }),
  http.post(`${B}/staff/invite/bulk/preview`, async ({ request }) => {
    const { invitees } = await json<{ invitees: Invitee[] }>(request)
    const seen = new Set<string>()
    const rows = invitees.map((invitee) => {
      const reason = inviteProblem(invitee, seen)
      return {
        ...invitee,
        role: roleById(invitee.role_id)?.name,
        status: reason ? 'invalid' : 'valid',
        reason: reason || 'Ready to invite',
      }
    })
    return ok({ rows })
  }),
  http.post(`${B}/staff/invite/bulk`, async ({ request }) => {
    const { invitees } = await json<{ invitees: Invitee[] }>(request)
    const rows = invitees.map((invitee) => {
      const reason = inviteProblem(invitee)
      if (!reason) createInvite(invitee)
      return {
        ...invitee,
        status: reason ? 'failed' : 'invited',
        reason: reason || 'Invitation sent',
      }
    })
    return ok({ rows })
  }),
  http.post<Params>(`${B}/staff/invite/resend/:staffId`, ({ params }) => {
    const staff = state.staff.find((item) => item.id === params.staffId)
    if (!staff) return fail(404, 'Staff member not found.')
    if (staff.status !== 'pending_invitation')
      return fail(409, 'This staff member has already accepted their invite.')
    log(staff, { action: 'staff:resend_invite' })
    return ok(staffRow(staff))
  }),
  http.patch<Params>(`${B}/staff/:action/:staffId`, async ({ params, request }) => {
    const staff = state.staff.find((item) => item.id === params.staffId)
    if (!staff) return fail(404, 'Staff member not found.')
    if (staff.id === ME.id) return fail(400, `You cannot ${params.action} yourself.`)
    if (params.action === 'suspend') {
      if (staff.status !== 'active') return fail(400, 'Only active staff members can be suspended.')
      const { reason } = await json<{ reason?: string }>(request)
      staff.status = 'suspended'
      log(staff, { action: 'admin:suspend', detail: reason })
    } else {
      if (staff.status !== 'suspended')
        return fail(400, 'Only suspended staff members can be reactivated.')
      staff.status = 'active'
      log(staff, { action: 'admin:reactivate' })
    }
    return ok(staffRow(staff))
  }),
  http.get<Params>(`${B}/staff/:staffId`, ({ params }) => {
    const staff = state.staff.find((item) => item.id === params.staffId)
    return staff ? ok(staffRow(staff)) : fail(404, 'Staff member not found.')
  }),
  http.patch<Params>(`${B}/staff/:staffId`, async ({ params, request }) => {
    const staff = state.staff.find((item) => item.id === params.staffId)
    if (!staff) return fail(404, 'Staff member not found.')
    const body = await json<{
      first_name: string
      last_name: string
      phone_number: string
      role_id: string
    }>(request)
    if (body.phone_number && !isPhone(body.phone_number))
      return fail(400, 'Enter a valid phone number.')
    if (staff.id === ME.id && staff.roleId !== body.role_id)
      return fail(403, 'You cannot change your own role.')
    if (!roleById(body.role_id)) return fail(404, 'Role not found.')
    Object.assign(staff, {
      firstName: body.first_name,
      lastName: body.last_name,
      phone: body.phone_number,
      roleId: body.role_id,
    })
    log(staff, { action: 'admin:update' })
    return ok(staffRow(staff))
  }),
  http.get<Params>(`${B}/staff/:staffId/activity`, ({ params, request }) => {
    const staff = state.staff.find((item) => item.id === params.staffId)
    if (!staff) return fail(404, 'Staff member not found.')
    const rows = staff.activity.map((entry) => ({
      id: entry.id,
      action: entry.action,
      target_name: fullName(staff),
      actor: entry.actor ? { id: 'actor', name: entry.actor } : null,
      before_summary: null,
      after_summary: {
        ...(entry.detail ? { reason: entry.detail } : {}),
        ...(entry.role ? { role: entry.role } : {}),
      },
      created_at: entry.createdAt,
    }))
    return ok(page(rows, new URL(request.url), 'activities'))
  }),
]
